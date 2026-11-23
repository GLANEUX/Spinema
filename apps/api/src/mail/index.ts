import nodemailer from 'nodemailer';
import type { Env } from '../env';
import type { Mailer } from '../mail-contract';

export { templates } from './templates';

type MailEnv = Pick<
  Env,
  'NODE_ENV' | 'SMTP_HOST' | 'SMTP_PORT' | 'SMTP_USER' | 'SMTP_PASSWORD' | 'MAIL_FROM'
>;

/** The part of a logger the mailer needs (Fastify's logger fits). */
export interface MailLog {
  info(obj: object, msg: string): void;
}

/**
 * SMTP when SMTP_HOST is set (Brevo on the servers, Mailpit in development), otherwise emails go
 * to the logs. In production the log never holds the body: it contains one-time links.
 */
export function createMailer(env: MailEnv, log: MailLog): Mailer {
  if (!env.SMTP_HOST) {
    return {
      async send({ to, subject, text }) {
        if (env.NODE_ENV === 'production') {
          log.info({ to, subject }, 'e-mail non envoyé : aucun SMTP configuré');
        } else {
          log.info({ to, subject, text }, 'e-mail écrit dans le journal (pas de SMTP)');
        }
      },
    };
  }
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    // 465 is TLS from the start; other ports switch to TLS with STARTTLS when the server offers it.
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD ?? '' } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return {
    async send({ to, subject, text, html }) {
      await transport.sendMail({ from: env.MAIL_FROM, to, subject, text, html });
    },
  };
}
