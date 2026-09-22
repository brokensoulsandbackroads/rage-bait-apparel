const ALLOWED_ORIGINS = new Set([
  "https://ragebaitapparel.co.uk",
  "https://www.ragebaitapparel.co.uk",
  "http://ragebaitapparel.co.uk",
  "http://www.ragebaitapparel.co.uk",
  "https://brokensoulsandbackroads.github.io"
]);

const FROM_EMAIL = "crew@ragebaitapparel.co.uk";

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://ragebaitapparel.co.uk";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8"
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(origin)
  });
}

function normaliseEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return new Response(null, { status: 403, headers: corsHeaders(origin) });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== "POST") {
      return json({ ok: false, error: "Method not allowed" }, 405, origin);
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ ok: false, error: "Origin not allowed" }, 403, origin);
    }

    try {
      const body = await request.json();

      // Honeypot. Humans never fill this field.
      if (String(body.website || "").trim()) {
        return json({ ok: true, status: "accepted" }, 200, origin);
      }

      const email = normaliseEmail(body.email);
      if (!validEmail(email)) {
        return json({ ok: false, error: "Please enter a valid email address." }, 400, origin);
      }

      const existing = await env.DB
        .prepare("SELECT email FROM crew WHERE email = ? LIMIT 1")
        .bind(email)
        .first();

      if (existing) {
        return json({ ok: true, status: "duplicate", message: "You're already one of us." }, 200, origin);
      }

      await env.DB
        .prepare("INSERT INTO crew (email, created_at) VALUES (?, datetime('now'))")
        .bind(email)
        .run();

      const { results } = await env.DB
        .prepare("SELECT email, created_at FROM crew ORDER BY created_at ASC, id ASC")
        .all();

      const list = results
        .map((member, index) => `${index + 1}. ${member.email}${member.email === email ? "  ← NEW" : ""}`)
        .join("\n");

      const subject = `RAGE BAIT | NEW CREW SIGNUP | ${results.length} MEMBERS`;
      const text = [
        "RAGE BAIT APPAREL",
        "NEW CREW SIGNUP",
        "",
        `Current Crew: ${results.length}`,
        "",
        list,
        "",
        "NEWEST CREW MEMBER:",
        email,
        "",
        `Signed up: ${new Date().toISOString()}`
      ].join("\n");

      await env.EMAIL.send({
        to: env.NOTIFY_TO,
        from: FROM_EMAIL,
        replyTo: FROM_EMAIL,
        subject,
        text
      });

      return json({
        ok: true,
        status: "added",
        count: results.length,
        message: "You're in. Welcome to the crew."
      }, 200, origin);
    } catch (error) {
      console.error(error);
      return json({ ok: false, error: "Signup failed. Please try again." }, 500, origin);
    }
  }
};
