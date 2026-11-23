// /i/<code>: with App Links the app opens directly; this page is the fallback.
// Kept in a file (not inline) so the Content-Security-Policy can forbid inline scripts.
const code = location.pathname.split('/').filter(Boolean)[1] ?? '';
document.getElementById('open').href = `spinema://i/${encodeURIComponent(code)}`;
