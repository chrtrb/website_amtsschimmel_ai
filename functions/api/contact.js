// Pages Function — Kontaktanfrage. Route: POST /api/contact
// Persistenz: KV-Binding "LEADS" (geteilt mit whitepaper-lead) — Eintrag mit src:"contact".
// DSGVO: Datensparsamkeit (Name, Behörde, dienstl. E-Mail, Nachricht, Einwilligung).
// Produktiv idealerweise an EU-Posteingang weiterreichen (z. B. Scaleway TEM → kontakt@amtsschimmel.ai).

export async function onRequestPost(context) {
  const { request, env } = context;
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: "bad_request" }, 400); }

  const name    = String(d.name || "").trim().slice(0, 200);
  const org     = String(d.org || "").trim().slice(0, 200);
  const email   = String(d.email || "").trim().slice(0, 320);
  const message = String(d.message || "").trim().slice(0, 4000);
  const consent = d.consent === true;

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (!name || !emailOk || !message || !consent) {
    return json({ ok: false, error: "validation" }, 422);
  }

  const lead = {
    name, org, email, message, consent,
    ts: new Date().toISOString(),
    src: "contact",
  };

  try {
    if (env.LEADS) {
      await env.LEADS.put(`contact:${Date.now()}:${email}`, JSON.stringify(lead), { metadata: { org, ts: lead.ts } });
    } else {
      console.log("CONTACT (kein KV-Binding):", JSON.stringify(lead));
    }
  } catch (e) {
    console.log("CONTACT store error:", e?.message || e);
  }

  // Optional: Benachrichtigungs-E-Mail an kontakt@amtsschimmel.ai (EU-Mailer) hier ergänzen.
  return json({ ok: true });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}
