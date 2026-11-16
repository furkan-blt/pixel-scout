const COOKIE = 'fut_draft_access';
const ROOT = '/games/fut-draft/';
const encoder = new TextEncoder();
const noStore = { 'cache-control': 'private, no-store', 'vary': 'Cookie' };

async function key() {
  return crypto.subtle.importKey('raw', encoder.encode(process.env.FUT_DRAFT_SESSION_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
function hex(bytes) { return Array.from(new Uint8Array(bytes), x => x.toString(16).padStart(2, '0')).join(''); }
async function issueSession() {
  const expires = String(Date.now() + 12 * 60 * 60 * 1000);
  return `${expires}.${hex(await crypto.subtle.sign('HMAC', await key(), encoder.encode(expires)))}`;
}
async function validSession(request) {
  const token = request.headers.get('cookie')?.split(';').map(x => x.trim()).find(x => x.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!token || !/^\d{13}\.[a-f0-9]{64}$/.test(token)) return false;
  const [expires, signature] = token.split('.');
  if (Number(expires) <= Date.now() || Number(expires) > Date.now() + 12 * 60 * 60 * 1000) return false;
  const bytes = Uint8Array.from(signature.match(/../g), x => parseInt(x, 16));
  return crypto.subtle.verify('HMAC', await key(), bytes, encoder.encode(expires));
}
function login(message = '', status = 200) {
  return new Response(`<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>FUT Draft · Giriş</title><style>
  *{box-sizing:border-box}body{margin:0;min-height:100svh;display:grid;place-items:center;padding:24px;background:#0b1512;color:#eef5eb;font-family:system-ui,sans-serif}main{width:min(100%,420px);padding:36px;border:1px solid #344737;border-radius:24px;background:#14211b;box-shadow:0 24px 80px #0004}.tag{color:#cbf477;font-size:12px;letter-spacing:3px;font-weight:800}h1{font-size:38px;margin:14px 0}p{color:#bbc8bd;line-height:1.6}label{display:block;margin:26px 0 10px;font-weight:650}input,button{width:100%;font:inherit;border-radius:12px;padding:15px}input{background:#0b1512;color:#fff;border:1px solid #627568}input:focus-visible,button:focus-visible,a:focus-visible{outline:3px solid #cbf477;outline-offset:4px}button{margin-top:16px;border:0;background:#cbf477;color:#112012;font-weight:800;cursor:pointer}a{display:inline-block;margin-top:24px;color:#bbc8bd}.error{color:#ffaca3;min-height:26px;margin:12px 0 0}
  </style></head><body><main><span class="tag">PIXEL SCOUT / ARCADE</span><h1>FUT Draft</h1><p>Sahaya çıkmak için oyun şifresini gir.</p><form method="post" action="${ROOT}"><label for="code">Oyun şifresi</label><input id="code" name="code" type="password" inputmode="numeric" autocomplete="current-password" maxlength="64" required autofocus aria-describedby="error"><p id="error" class="error" role="alert">${message}</p><button type="submit">Oyuna gir →</button></form><a href="/games/">← Oyunlara dön</a></main></body></html>`, {
    status, headers: { ...noStore, 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'" }
  });
}

export default async function protectDraft(request) {
  const url = new URL(request.url);
  if (url.pathname !== ROOT.slice(0, -1) && !url.pathname.startsWith(ROOT)) return new Response(null, { headers: { 'x-middleware-next': '1' } });
  if (!process.env.FUT_DRAFT_PASSWORD || !process.env.FUT_DRAFT_SESSION_SECRET) return login('Oyun girişi şu anda hazırlanıyor. Lütfen biraz sonra tekrar dene.', 503);
  if (request.method === 'POST' && [ROOT, ROOT.slice(0, -1), `${ROOT}index.html`].includes(url.pathname)) {
    if (request.headers.get('origin') !== url.origin) return login('Giriş sayfasını yenileyip tekrar dene.', 403);
    if (Number(request.headers.get('content-length') || 0) > 1024) return login('Geçersiz giriş.', 400);
    let code;
    try { code = (await request.formData()).get('code'); } catch { return login('Geçersiz giriş.', 400); }
    if (typeof code !== 'string' || code !== process.env.FUT_DRAFT_PASSWORD) return login('Şifre yanlış. Tekrar dene.', 401);
    return new Response(null, { status: 303, headers: { ...noStore, location: ROOT, 'set-cookie': `${COOKIE}=${await issueSession()}; Path=${ROOT}; HttpOnly; Secure; SameSite=Strict; Max-Age=43200` } });
  }
  if (await validSession(request)) return new Response(null, { headers: { ...noStore, 'x-middleware-next': '1' } });
  const page = [ROOT, ROOT.slice(0, -1), `${ROOT}index.html`].includes(url.pathname);
  return page ? login() : new Response('Önce FUT Draft şifresiyle giriş yapmalısın.', { status: 401, headers: noStore });
}
