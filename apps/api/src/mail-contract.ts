/** What the auth code needs from the email module (docs/comptes.md, "E-mails"). */
export interface Mailer {
  send(m: { to: string; subject: string; text: string; html: string }): Promise<void>;
}

export interface MailTemplates {
  verificationEmail(p: { username: string; url: string }): {
    subject: string;
    text: string;
    html: string;
  };
  resetPasswordEmail(p: { username: string; url: string }): {
    subject: string;
    text: string;
    html: string;
  };
  accountDeletedEmail(p: { username: string }): { subject: string; text: string; html: string };
}
