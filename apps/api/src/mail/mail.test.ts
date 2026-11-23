import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { GenericContainer, Wait, type StartedTestContainer } from 'testcontainers';
import { createMailer, templates } from './index';
import { escapeHtml } from './templates';

const url = 'https://api.example.test/api/auth/verify-email?token=abc&callbackURL=spinema://x';
const baseEnv = {
  NODE_ENV: 'development' as const,
  SMTP_HOST: undefined,
  SMTP_PORT: 587,
  SMTP_USER: undefined,
  SMTP_PASSWORD: undefined,
  MAIL_FROM: 'Spinema <noreply@spinema.fr>',
};

describe('templates', () => {
  it('verification: French, link in text and html, 24 h validity', () => {
    const mail = templates.verificationEmail({ username: 'Lou', url });
    expect(mail.subject).toBe('Confirme ton adresse e-mail');
    expect(mail.text).toContain('Salut Lou,');
    expect(mail.text).toContain(url);
    expect(mail.text).toContain('24 heures');
    expect(mail.text).toContain("Si ce n'est pas toi, ignore ce message");
    expect(mail.html).toContain(escapeHtml(url));
    expect(mail.html).toContain('<html lang="fr">');
  });

  it('reset: link valid 1 h, used once', () => {
    const mail = templates.resetPasswordEmail({ username: 'Lou', url });
    expect(mail.subject).toBe('Choisis un nouveau mot de passe');
    expect(mail.text).toContain(url);
    expect(mail.text).toContain('1 heure');
    expect(mail.html).toContain(escapeHtml(url));
    expect(mail.html).toContain('Nouveau mot de passe');
  });

  it('deletion: no link, mentions the 14-day backups', () => {
    const mail = templates.accountDeletedEmail({ username: 'Lou' });
    expect(mail.subject).toBe('Ton compte Spinema est supprimé');
    expect(mail.text).toContain('14 jours');
    expect(mail.html).not.toContain('<a ');
  });

  it('escapes the username in the html', () => {
    const evil = '<script>alert("x")</script>';
    for (const mail of [
      templates.verificationEmail({ username: evil, url }),
      templates.resetPasswordEmail({ username: evil, url }),
      templates.accountDeletedEmail({ username: evil }),
    ]) {
      expect(mail.html).not.toContain('<script>');
      expect(mail.html).toContain('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
    }
    expect(escapeHtml(`a&b'c`)).toBe('a&amp;b&#39;c');
  });
});

describe('log transport (no SMTP)', () => {
  const mail = { to: 'lou@example.test', ...templates.verificationEmail({ username: 'Lou', url }) };

  it('writes the whole email in development, so the link can be clicked', async () => {
    const log = { info: vi.fn() };
    await createMailer(baseEnv, log).send(mail);
    expect(log.info).toHaveBeenCalledOnce();
    expect(JSON.stringify(log.info.mock.calls[0])).toContain('token=abc');
  });

  it('never writes the body (one-time links) in production', async () => {
    const log = { info: vi.fn() };
    await createMailer({ ...baseEnv, NODE_ENV: 'production' }, log).send(mail);
    const logged = JSON.stringify(log.info.mock.calls[0]);
    expect(logged).toContain('lou@example.test');
    expect(logged).toContain('Confirme ton adresse e-mail');
    expect(logged).not.toContain('token=abc');
  });
});

describe('SMTP transport (Mailpit)', () => {
  let mailpit: StartedTestContainer;
  let api: string;

  beforeAll(async () => {
    mailpit = await new GenericContainer(
      'axllent/mailpit:v1.34.0@sha256:23a2ef85bc50853ab3093645d1d64679afd8887e89da5e48a88940c172591a4e',
    )
      .withExposedPorts(1025, 8025)
      // Accept any login without TLS, to exercise the authenticated path like Brevo.
      .withEnvironment({ MP_SMTP_AUTH_ACCEPT_ANY: '1', MP_SMTP_AUTH_ALLOW_INSECURE: '1' })
      .withWaitStrategy(Wait.forHttp('/livez', 8025))
      .start();
    api = `http://${mailpit.getHost()}:${mailpit.getMappedPort(8025)}/api/v1`;
  }, 120_000);

  afterAll(async () => {
    await mailpit?.stop();
  });

  it('delivers the email with the sender, text and html', async () => {
    const mailer = createMailer(
      {
        ...baseEnv,
        SMTP_HOST: mailpit.getHost(),
        SMTP_PORT: mailpit.getMappedPort(1025),
        SMTP_USER: 'spinema',
        SMTP_PASSWORD: 'secret',
      },
      { info: vi.fn() },
    );
    await mailer.send({
      to: 'lou@example.test',
      ...templates.resetPasswordEmail({ username: 'Lou', url }),
    });
    const list = (await (await fetch(`${api}/messages`)).json()) as {
      messages: { ID: string; Subject: string; From: { Address: string; Name: string } }[];
    };
    expect(list.messages).toHaveLength(1);
    const [message] = list.messages;
    expect(message?.Subject).toBe('Choisis un nouveau mot de passe');
    expect(message?.From).toMatchObject({ Name: 'Spinema', Address: 'noreply@spinema.fr' });
    const full = (await (await fetch(`${api}/message/${message?.ID}`)).json()) as {
      Text: string;
      HTML: string;
    };
    expect(full.Text).toContain(url);
    expect(full.HTML).toContain('Nouveau mot de passe');
  }, 30_000);
});
