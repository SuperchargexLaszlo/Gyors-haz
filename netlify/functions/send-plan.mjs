/**
 * Az elkészült alaprajz kiküldése e-mailben — Brevo transactional API.
 *
 * Két levél megy:
 *   1. a látogatónak az alaprajza, PNG mellékletként
 *   2. a csapatnak értesítés MINDEN elkészült alaprajzról — nem csak akkor,
 *      ha a látogató árajánlatot is kért. Aki idáig eljutott, az konkrét
 *      házban gondolkodik; ez akkor is információ, ha nem pipálta be.
 *
 * A második levél best-effort: ha elhasal, a látogató attól még megkapja a
 * rajzot, és a letöltés is lefut.
 *
 * Netlify környezeti változók:
 *   BREVO_API_KEY  — kötelező. Enélkül a letöltés MŰKÖDIK, csak levél nem megy.
 *   MAIL_FROM      — feladó a Brevóban igazolt domainen (alap: no-reply@gyors-haz.hu)
 *   TEAM_EMAIL     — ide megy az értesítés (alap: info@instantotthonok.com)
 */

const SITE = 'https://gyors-haz.hu';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REPLY_TO = 'info@instantotthonok.com';

export default async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Hibás kérés.' }, 400);
  }

  const email = String(body?.email ?? '').trim();
  const name = String(body?.name ?? '').trim().slice(0, 80);
  const image = body?.image;
  const rooms = String(body?.rooms ?? '').slice(0, 800);
  const wantsQuote = body?.sendToUs === true;

  if (!EMAIL_RE.test(email)) {
    return json({ error: 'Adj meg egy érvényes e-mail címet.' }, 400);
  }
  if (typeof image !== 'string' || !image.startsWith('data:image/png')) {
    return json({ error: 'Hiányzik az alaprajz képe. Rajzolj legalább egy helyiséget.' }, 400);
  }
  if (image.length > 11_000_000) {
    return json({ error: 'Az alaprajz képe túl nagy. Töltsd le közvetlenül a gombbal.' }, 413);
  }
  /* Egy valódi alaprajz PNG-je néhány tíz kilobájt. Ha ennél sokkal kisebb,
     akkor a vászon üresen renderelődött — inkább hibát adunk vissza, mint
     hogy a látogató egy ÜRES CSATOLMÁNYT kapjon, és azt higgye, megvan a
     rajza. (Pontosan ez fordult elő egyszer élesben.) */
  if (image.length < 5000) {
    return json({ error: 'A rajz üresen érkezett. Frissítsd az oldalt, és próbáld újra.' }, 422);
  }

  const key = process.env.BREVO_API_KEY;
  if (!key) {
    return json({ error: 'Az e-mail küldés még nincs beállítva ezen a környezeten.' }, 503);
  }

  const from = process.env.MAIL_FROM || 'no-reply@gyors-haz.hu';
  const team = process.env.TEAM_EMAIL || 'info@instantotthonok.com';
  const base64 = image.split(',')[1] ?? '';
  if (base64.length < 4000) {
    return json({ error: 'A rajz üresen érkezett. Frissítsd az oldalt, és próbáld újra.' }, 422);
  }
  const kb = Math.round((base64.length * 3) / 4 / 1024);
  const hello = name ? `Szia ${escapeHtml(name)}!` : 'Szia!';
  const send = (payload) =>
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: { 'api-key': key, 'Content-Type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(payload),
    });

  const html = `
<div style="font-family:Inter,Arial,Helvetica,sans-serif;color:#1A3C5E;max-width:560px;line-height:1.6">
  <h2 style="margin:0 0 10px;font-size:20px">${hello}</h2>
  <p style="color:#4b5563;margin:0">
    Itt az alaprajz, amit a gyors-haz.hu tervezőjében megrajzoltál.
    A rajzot PNG-ként mellékeltük — nyomtatható, és el tudod küldeni bárkinek.
  </p>
  ${rooms ? `<p style="color:#4b5563;font-size:14px;margin:14px 0 0">Helyiségek: ${escapeHtml(rooms)}</p>` : ''}
  <p style="margin:22px 0 0">
    <a href="${SITE}/alaprajz-rajzolo"
       style="background:#E8960A;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;display:inline-block">
      Tovább szerkesztem
    </a>
  </p>
  <p style="color:#4b5563;font-size:14px;margin:22px 0 0">
    ${wantsQuote
      ? 'Árajánlatot kértél: kollégánk 24 órán belül keres, kötelezettség nélkül.'
      : 'Ha szeretnéd, mennyibe kerülne ez megépítve, írj vissza erre a levélre — ingyenes, kötelezettség nélküli ajánlatot adunk rá.'}
  </p>
  <p style="color:#4b5563;font-size:14px;margin:18px 0 0">
    Amiből válogathatsz:<br>
    <a href="${SITE}/konnyuszerkezetes" style="color:#1A3C5E">Könnyűszerkezetes házak</a> ·
    <a href="${SITE}/modulhaz" style="color:#1A3C5E">Modulházak</a> ·
    <a href="${SITE}/kontenerhaz" style="color:#1A3C5E">Konténerházak</a>
  </p>
  <p style="color:#9ca3af;font-size:12px;margin:26px 0 0;border-top:1px solid #e5e7eb;padding-top:14px">
    gyors-haz.hu — könnyűszerkezetes, moduláris és konténerházak kulcsrakészen.<br>
    Ezt a levelet azért kaptad, mert kérted az alaprajzod kiküldését.
    <a href="${SITE}/adatvedelmi-tajekoztato" style="color:#9ca3af">Adatvédelmi tájékoztató</a>
  </p>
</div>`;

  try {
    const r = await send({
      sender: { email: from, name: 'Gyors Ház' },
      to: [{ email, name: name || undefined }],
      replyTo: { email: REPLY_TO, name: 'Gyors Ház' },
      subject: 'Az alaprajzod — gyors-haz.hu',
      htmlContent: html,
      textContent:
        `${name ? `Szia ${name}!` : 'Szia!'}\n\n` +
        `Itt az alaprajz, amit a gyors-haz.hu tervezőjében megrajzoltál. A rajzot PNG-ként mellékeltük.\n\n` +
        `Tovább szerkeszted: ${SITE}/alaprajz-rajzolo\n`,
      attachment: [{ name: 'alaprajz.png', content: base64 }],
      tags: ['alaprajz'],
    });
    if (!r.ok) {
      const detail = (await r.text()).slice(0, 300);
      return json({ error: 'Az e-mail szolgáltató elutasította a kérést.', detail }, 502);
    }
  } catch {
    return json({ error: 'Nem sikerült elküldeni az e-mailt. Próbáld újra.' }, 502);
  }

  /* Értesítés a csapatnak — MINDEN alaprajzról, nem csak ajánlatkérésnél.
     Best effort: a látogató válaszát nem befolyásolja, ha elhasal. */
  try {
    await send({
      sender: { email: from, name: 'gyors-haz.hu' },
      to: [{ email: team }],
      replyTo: { email, name: name || undefined },
      subject: wantsQuote
        ? `ÁRAJÁNLATOT KÉR — alaprajz: ${email}`
        : `Alaprajz készült: ${email}`,
      htmlContent: `
<div style="font-family:Inter,Arial,sans-serif;color:#1A3C5E;line-height:1.6">
  <p style="margin:0 0 8px"><strong>${wantsQuote
    ? 'A látogató árajánlatot kért — 24 órán belül vissza kell hívni.'
    : 'Egy látogató alaprajzot készített. Árajánlatot NEM kért.'}</strong></p>
  <p style="margin:0">Név: ${escapeHtml(name || '(nem adta meg)')}<br>
     E-mail: <a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></p>
  ${rooms ? `<p style="color:#4b5563;font-size:14px;margin:14px 0 0">Helyiségek: ${escapeHtml(rooms)}</p>` : ''}
  <p style="color:#9ca3af;font-size:12px;margin:20px 0 0">
    A rajz mellékelve (${kb} kB). Erre a levélre válaszolva közvetlenül a látogatónak írsz.
  </p>
</div>`,
      textContent:
        `${wantsQuote ? 'ÁRAJÁNLATOT KÉR.' : 'Árajánlatot nem kért.'}\n` +
        `Név: ${name || '(nem adta meg)'}\nE-mail: ${email}\n${rooms ? `Helyiségek: ${rooms}\n` : ''}`,
      attachment: [{ name: 'alaprajz.png', content: base64 }],
      tags: ['alaprajz-ertesito'],
    });
  } catch {
    // Szándékosan elnyelve: a látogató levele már elment.
  }

  return json({ ok: true });
};

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
  );
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
