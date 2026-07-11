// Pages Function — Pilot-Anfrage. Route: POST /api/pilot-lead
// Persistenz: KV-Binding "LEADS" — Eintrag mit src:"pilot".
// DSGVO: Datensparsamkeit (Name, Gemeinde, Rolle, dienstl. E-Mail, Nachricht, Einwilligung) — KEINE IP-Speicherung.
// Spamschutz: Honeypot-Feld "website" (muss leer sein) statt Captcha.
// Produktiv idealerweise an EU-Posteingang weiterreichen (z. B. Brevo → kontakt@amtsschimmel.ai).

export async function onRequestPost(context) {
  const { request, env } = context;
  let d;
  try { d = await request.json(); } catch { return json({ ok: false, error: "bad_request" }, 400); }

  // Honeypot: Bots füllen das unsichtbare Feld — Anfrage still verwerfen (ok melden, kein Hinweis).
  if (String(d.website || "").trim() !== "") return json({ ok: true });

  const name     = String(d.name || "").trim().slice(0, 200);
  const gemeinde = String(d.gemeinde || "").trim().slice(0, 200);
  const rolle    = String(d.rolle || "").trim().slice(0, 120);
  const email    = String(d.email || "").trim().slice(0, 320);
  const message  = String(d.message || "").trim().slice(0, 4000);
  const consent  = d.consent === true;

  const emailOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
  if (!name || !gemeinde || !emailOk || !consent) {
    return json({ ok: false, error: "validation" }, 422);
  }

  const lead = {
    name, gemeinde, rolle, email, message, consent,
    ts: new Date().toISOString(),
    src: "pilot",
  };

  try {
    if (env.LEADS) {
      await env.LEADS.put(`pilot:${Date.now()}:${email}`, JSON.stringify(lead), { metadata: { gemeinde, ts: lead.ts } });
    } else {
      console.log("PILOT (kein KV-Binding):", JSON.stringify(lead));
    }
  } catch (e) {
    console.log("PILOT store error:", e?.message || e);
  }

  // Optional: Benachrichtigungs-E-Mail an kontakt@amtsschimmel.ai (EU-Mailer) hier ergänzen.
  return json({ ok: true });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8" } });
}
