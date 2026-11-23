import type { MailTemplates } from '../mail-contract';

// Colours of the charte (design/charte-graphique.html).
const C = {
  cream: '#f7f2e6',
  brown: '#2b211a',
  gold: '#d9a441',
  ink: '#1d1b2e',
  muted: '#5c5546',
};
const FONT = "'Helvetica Neue', Arial, sans-serif";

const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);

const paragraph = (html: string) =>
  `<p style="margin:0 0 14px;font:16px/1.5 ${FONT};color:${C.ink};">${html}</p>`;

/** One cream ticket on the dark background, table-based with inline styles: what mail clients render. */
function layout(title: string, paragraphs: string[], button?: { label: string; url: string }) {
  const cta = button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;"><tr><td style="background:${C.gold};border-radius:8px;">` +
      `<a href="${escapeHtml(button.url)}" style="display:inline-block;padding:14px 22px;font:italic 900 15px ${FONT};color:${C.ink};text-decoration:none;text-transform:uppercase;">${button.label}</a>` +
      `</td></tr></table>` +
      paragraph(
        `<span style="font-size:13px;color:${C.muted};">Le bouton ne marche pas ? Copie ce lien :<br />${escapeHtml(button.url)}</span>`,
      )
    : '';
  return `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background:${C.brown};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.brown};">
      <tr>
        <td align="center" style="padding:32px 16px;">
          <p style="margin:0 0 18px;font:900 24px ${FONT};color:${C.gold};">SPINEMA</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:${C.cream};">
            <tr>
              <td style="padding:24px 22px;">
                <h1 style="margin:0 0 14px;font:900 22px/1.2 ${FONT};color:${C.ink};">${title}</h1>
                ${paragraphs.map(paragraph).join('\n')}
                ${cta}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export const templates: MailTemplates = {
  verificationEmail({ username, url }) {
    const subject = 'Confirme ton adresse e-mail';
    const text = [
      `Salut ${username},`,
      '',
      'Pour finir ton inscription sur Spinema, confirme ton adresse e-mail avec ce lien :',
      url,
      '',
      'Le lien est valable 24 heures.',
      "Si ce n'est pas toi, ignore ce message : aucun compte ne sera activé.",
    ].join('\n');
    const html = layout(
      subject,
      [
        `Salut ${escapeHtml(username)},`,
        'Pour finir ton inscription sur Spinema, confirme ton adresse e-mail.',
        "Le lien est valable 24 heures. Si ce n'est pas toi, ignore ce message : aucun compte ne sera activé.",
      ],
      { label: 'Confirmer mon e-mail', url },
    );
    return { subject, text, html };
  },

  resetPasswordEmail({ username, url }) {
    const subject = 'Choisis un nouveau mot de passe';
    const text = [
      `Salut ${username},`,
      '',
      'Tu as demandé à changer ton mot de passe Spinema. Choisis-en un nouveau avec ce lien :',
      url,
      '',
      'Le lien est valable 1 heure et ne sert qu’une fois.',
      "Si ce n'est pas toi, ignore ce message : ton mot de passe ne change pas.",
    ].join('\n');
    const html = layout(
      subject,
      [
        `Salut ${escapeHtml(username)},`,
        'Tu as demandé à changer ton mot de passe Spinema.',
        "Le lien est valable 1 heure et ne sert qu’une fois. Si ce n'est pas toi, ignore ce message : ton mot de passe ne change pas.",
      ],
      { label: 'Nouveau mot de passe', url },
    );
    return { subject, text, html };
  },

  accountDeletedEmail({ username }) {
    const subject = 'Ton compte Spinema est supprimé';
    const lines = [
      'Ton compte Spinema et tout ce qu’il contenait sont supprimés.',
      'Les dernières copies disparaissent de nos sauvegardes sous 14 jours.',
      'Merci d’être passé·e par la vidéothèque.',
    ];
    const text = [`Salut ${username},`, '', ...lines].join('\n');
    const html = layout(subject, [`Salut ${escapeHtml(username)},`, ...lines]);
    return { subject, text, html };
  },
};
