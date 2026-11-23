/**
 * What the accounts need from the email module (apps/api/src/mail/, see docs/comptes.md).
 * Kept apart so the auth code and its tests don't depend on how emails are sent.
 */
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export interface Mailer {
  send(message: MailMessage): Promise<void>;
}

export type MailContent = Omit<MailMessage, 'to'>;

export interface MailTemplates {
  verificationEmail(params: { username: string; url: string }): MailContent;
  resetPasswordEmail(params: { username: string; url: string }): MailContent;
  accountDeletedEmail(params: { username: string }): MailContent;
}
