/**
 * Stand-in until the email module (apps/api/src/mail/) is merged: writes emails to the logs
 * and uses plain French templates. index.ts switches to `createMailer` / `templates` from
 * './mail' once it exists, and this file is deleted.
 */
import type { Mailer, MailTemplates } from './mail-contract';

export function logMailer(log: (message: string) => void): Mailer {
  return {
    // No address in the logs (privacy policy): only the subject.
    send: async ({ subject }) => {
      log(`Email "${subject}" not sent: no email module yet`);
    },
  };
}

export const plainTemplates: MailTemplates = {
  verificationEmail: ({ username, url }) => ({
    subject: 'Confirme ton adresse e-mail',
    text: `Salut ${username}, confirme ton adresse : ${url}`,
    html: `<p>Salut ${username}, <a href="${url}">confirme ton adresse</a>.</p>`,
  }),
  resetPasswordEmail: ({ username, url }) => ({
    subject: 'Ton nouveau mot de passe',
    text: `Salut ${username}, choisis un nouveau mot de passe : ${url}`,
    html: `<p>Salut ${username}, <a href="${url}">choisis un nouveau mot de passe</a>.</p>`,
  }),
  accountDeletedEmail: ({ username }) => ({
    subject: 'Ton compte Spinema est supprimé',
    text: `Salut ${username}, ton compte et tes données sont supprimés.`,
    html: `<p>Salut ${username}, ton compte et tes données sont supprimés.</p>`,
  }),
};
