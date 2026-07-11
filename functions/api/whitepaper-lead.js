// Cloudflare Pages Function — White-Paper-Lead-Erfassung
// Route: POST /api/whitepaper-lead   (Datei functions/api/whitepaper-lead.js)
//
// Persistenz: KV-Binding "LEADS" anlegen
//   Cloudflare Dashboard > Pages-Projekt > Settings > Functions > KV namespace bindings
//   Variablenname: LEADS  →  KV-Namespace (z. B. "amtsschimmel-leads")
// Ohne Binding läuft die Function trotzdem (Lead wird dann nur geloggt, nicht gespeichert).
//
// DSGVO: nur Datensparsamkeit (Name, Behörde, dienstliche E-Mail, Einwilligung, Zeitstempel).
// Für den Produktivbetrieb Lead idealerweise an einen EU-Posteingang / EU-CRM weiterreichen
// (z. B. via E-Mail an kontakt@amtsschimmel.ai). Aufbewahrung/Löschfristen in der
// Datenschutzerklärung abbilden.

export async function onRequestPost(context) {
  const { request, env } = context;

  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: "bad_request" }, 400); }

  const name    = String(data.name || "").trim().slice(0, 200);
  const org     = String(data.org || "").trim().slice(0, 200);
  const email   = String(data.email || "").trim().slice(0, 320);
  const consent = data.consent === true;

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (!name || !org || !emailOk || !consent) {
    return json({ ok: false, error: "validation" }, 422);
  }

  const lead = {
    name, org, email, consent,
    ts: new Date().toISOString(),
    src: "whitepaper-ki-in-der-verwaltung",
  };

  try {
    if (env.LEADS) {
      await env.LEADS.put(`lead:${Date.now()}:${email}`, JSON.stringify(lead), {
        metadata: { org, ts: lead.ts },
      });
    } else {
      console.log("LEAD (kein KV-Binding):", JSON.stringify(lead));
    }
  } catch (e) {
    console.log("LEAD store error:", e?.message || e);
    // Lead-Erfassung darf den Download nicht blockieren → trotzdem ok zurückgeben
  }

  // Optional: hier eine Benachrichtigungs-E-Mail an kontakt@amtsschimmel.ai auslösen
  // (z. B. MailChannels/Resend) — bewusst weggelassen, um keine Secrets zu erzwingen.

  return json({ ok: true });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
