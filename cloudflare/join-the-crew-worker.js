const ALLOWED_ORIGINS = new Set([
  "https://ragebaitapparel.co.uk",
  "https://www.ragebaitapparel.co.uk",
  "http://ragebaitapparel.co.uk",
  "http://www.ragebaitapparel.co.uk",
  "https://brokensoulsandbackroads.github.io"
]);

const FROM_EMAIL = "crew@ragebaitapparel.co.uk";
const MAX_COMMENT_LENGTH = 500;
const MAX_NAME_LENGTH = 32;

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.has(origin) ? origin : "https://ragebaitapparel.co.uk";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Rage-Bait-Admin",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
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

function cleanText(value) {
  return String(value || "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}

function containsLink(value) {
  return /(?:https?:\/\/|www\.)/i.test(value);
}

function adminAuthorised(request, env) {
  const supplied = request.headers.get("X-Rage-Bait-Admin") || "";
  const expected = String(env.MODERATOR_KEY || "");
  return expected.length >= 16 && supplied.length === expected.length && supplied === expected;
}

function requireAdmin(request, env, origin) {
  if (!env.MODERATOR_KEY) {
    return json({ ok: false, error: "Moderator access has not been configured." }, 503, origin);
  }
  if (!adminAuthorised(request, env)) {
    return json({ ok: false, error: "Moderator key rejected." }, 401, origin);
  }
  return null;
}

async function topTrollId(env) {
  const top = await env.DB
    .prepare(`
      SELECT id
      FROM banter_comments
      WHERE hidden = 0
      ORDER BY (likes + laughs + chaos) DESC, created_at ASC, id ASC
      LIMIT 1
    `)
    .first();

  if (!top) return null;

  const counts = await env.DB
    .prepare("SELECT likes, laughs, chaos FROM banter_comments WHERE id = ? LIMIT 1")
    .bind(top.id)
    .first();

  const score = (Number(counts?.likes) || 0) + (Number(counts?.laughs) || 0) + (Number(counts?.chaos) || 0);
  return score > 0 ? top.id : null;
}

async function listComments(request, env, origin) {
  const url = new URL(request.url);
  const sort = url.searchParams.get("sort") || "newest";
  const requestedLimit = Number(url.searchParams.get("limit") || 20);
  const limit = Number.isFinite(requestedLimit) ? Math.min(50, Math.max(1, Math.floor(requestedLimit))) : 20;

  let orderBy = "created_at DESC, id DESC";
  if (sort === "liked") {
    orderBy = "(likes + laughs + chaos) DESC, created_at DESC, id DESC";
  } else if (sort === "chaotic") {
    orderBy = "chaos DESC, (likes + laughs) DESC, created_at DESC, id DESC";
  }

  const { results } = await env.DB
    .prepare(`
      SELECT id, name, message, likes, laughs, chaos, created_at
      FROM banter_comments
      WHERE hidden = 0
      ORDER BY ${orderBy}
      LIMIT ?
    `)
    .bind(limit)
    .all();

  return json({
    ok: true,
    comments: results || [],
    topTrollId: await topTrollId(env)
  }, 200, origin);
}

async function addComment(request, env, origin) {
  const body = await request.json();

  if (cleanText(body.website)) {
    return json({ ok: true, status: "accepted" }, 200, origin);
  }

  const name = cleanText(body.name);
  const message = cleanText(body.message);

  if (name.length < 2 || name.length > MAX_NAME_LENGTH) {
    return json({ ok: false, error: "Display name must be between 2 and 32 characters." }, 400, origin);
  }

  if (message.length < 3 || message.length > MAX_COMMENT_LENGTH) {
    return json({ ok: false, error: "Banter must be between 3 and 500 characters." }, 400, origin);
  }

  if (containsLink(message)) {
    return json({ ok: false, error: "Links aren't allowed in banter posts." }, 400, origin);
  }

  const duplicate = await env.DB
    .prepare(`
      SELECT id
      FROM banter_comments
      WHERE lower(name) = lower(?)
        AND message = ?
        AND datetime(created_at) >= datetime('now', '-2 minutes')
      LIMIT 1
    `)
    .bind(name, message)
    .first();

  if (duplicate) {
    return json({ ok: false, error: "You already posted that one. Give the internet a second." }, 429, origin);
  }

  const result = await env.DB
    .prepare(`
      INSERT INTO banter_comments (name, message, likes, laughs, chaos, hidden, created_at)
      VALUES (?, ?, 0, 0, 0, 0, datetime('now'))
    `)
    .bind(name, message)
    .run();

  const insertedId = result?.meta?.last_row_id;
  const comment = insertedId
    ? await env.DB
        .prepare("SELECT id, name, message, likes, laughs, chaos, created_at FROM banter_comments WHERE id = ? LIMIT 1")
        .bind(insertedId)
        .first()
    : null;

  return json({
    ok: true,
    status: "added",
    comment,
    message: "Posted. The internet is worse now."
  }, 201, origin);
}

async function reactToComment(request, env, origin, id) {
  const body = await request.json();
  const reaction = cleanText(body.reaction).toLowerCase();
  const columns = {
    like: "likes",
    laugh: "laughs",
    chaos: "chaos"
  };
  const column = columns[reaction];

  if (!column) {
    return json({ ok: false, error: "Unknown reaction." }, 400, origin);
  }

  const existing = await env.DB
    .prepare("SELECT id FROM banter_comments WHERE id = ? AND hidden = 0 LIMIT 1")
    .bind(id)
    .first();

  if (!existing) {
    return json({ ok: false, error: "Comment not found." }, 404, origin);
  }

  await env.DB
    .prepare(`UPDATE banter_comments SET ${column} = ${column} + 1 WHERE id = ?`)
    .bind(id)
    .run();

  const counts = await env.DB
    .prepare("SELECT likes, laughs, chaos FROM banter_comments WHERE id = ? LIMIT 1")
    .bind(id)
    .first();

  return json({
    ok: true,
    counts,
    topTrollId: await topTrollId(env)
  }, 200, origin);
}

async function adminListComments(request, env, origin) {
  const guard = requireAdmin(request, env, origin);
  if (guard) return guard;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") || "all";
  const q = cleanText(url.searchParams.get("q") || "").slice(0, 100);
  const requestedLimit = Number(url.searchParams.get("limit") || 200);
  const limit = Number.isFinite(requestedLimit) ? Math.min(500, Math.max(1, Math.floor(requestedLimit))) : 200;

  let where = "1 = 1";
  const binds = [];

  if (status === "visible") where += " AND hidden = 0";
  if (status === "hidden") where += " AND hidden = 1";

  if (q) {
    where += " AND (lower(name) LIKE lower(?) OR lower(message) LIKE lower(?))";
    const term = `%${q}%`;
    binds.push(term, term);
  }

  const { results } = await env.DB
    .prepare(`
      SELECT id, name, message, likes, laughs, chaos, hidden, created_at
      FROM banter_comments
      WHERE ${where}
      ORDER BY created_at DESC, id DESC
      LIMIT ?
    `)
    .bind(...binds, limit)
    .all();

  const counts = await env.DB
    .prepare(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN hidden = 0 THEN 1 ELSE 0 END) AS visible,
        SUM(CASE WHEN hidden = 1 THEN 1 ELSE 0 END) AS hidden
      FROM banter_comments
    `)
    .first();

  return json({
    ok: true,
    comments: results || [],
    counts: {
      total: Number(counts?.total) || 0,
      visible: Number(counts?.visible) || 0,
      hidden: Number(counts?.hidden) || 0
    }
  }, 200, origin);
}

async function adminSetVisibility(request, env, origin, id) {
  const guard = requireAdmin(request, env, origin);
  if (guard) return guard;

  const body = await request.json();
  if (typeof body.hidden !== "boolean") {
    return json({ ok: false, error: "hidden must be true or false." }, 400, origin);
  }

  const existing = await env.DB
    .prepare("SELECT id FROM banter_comments WHERE id = ? LIMIT 1")
    .bind(id)
    .first();

  if (!existing) {
    return json({ ok: false, error: "Comment not found." }, 404, origin);
  }

  await env.DB
    .prepare("UPDATE banter_comments SET hidden = ? WHERE id = ?")
    .bind(body.hidden ? 1 : 0, id)
    .run();

  return json({
    ok: true,
    id,
    hidden: body.hidden,
    message: body.hidden ? "Comment hidden." : "Comment restored."
  }, 200, origin);
}

async function adminDeleteComment(request, env, origin, id) {
  const guard = requireAdmin(request, env, origin);
  if (guard) return guard;

  const existing = await env.DB
    .prepare("SELECT id FROM banter_comments WHERE id = ? LIMIT 1")
    .bind(id)
    .first();

  if (!existing) {
    return json({ ok: false, error: "Comment not found." }, 404, origin);
  }

  await env.DB
    .prepare("DELETE FROM banter_comments WHERE id = ?")
    .bind(id)
    .run();

  return json({ ok: true, id, message: "Comment permanently deleted." }, 200, origin);
}

async function signup(request, env, origin) {
  const body = await request.json();

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
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (request.method === "OPTIONS") {
      if (origin && !ALLOWED_ORIGINS.has(origin)) {
        return new Response(null, { status: 403, headers: corsHeaders(origin) });
      }
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (origin && !ALLOWED_ORIGINS.has(origin)) {
      return json({ ok: false, error: "Origin not allowed" }, 403, origin);
    }

    try {
      if (path === "/comments" && request.method === "GET") {
        return await listComments(request, env, origin);
      }

      if (path === "/comments" && request.method === "POST") {
        return await addComment(request, env, origin);
      }

      const reactionMatch = path.match(/^\/comments\/(\d+)\/react$/);
      if (reactionMatch && request.method === "POST") {
        return await reactToComment(request, env, origin, Number(reactionMatch[1]));
      }

      if (path === "/admin/comments" && request.method === "GET") {
        return await adminListComments(request, env, origin);
      }

      const adminVisibilityMatch = path.match(/^\/admin\/comments\/(\d+)\/visibility$/);
      if (adminVisibilityMatch && request.method === "POST") {
        return await adminSetVisibility(request, env, origin, Number(adminVisibilityMatch[1]));
      }

      const adminDeleteMatch = path.match(/^\/admin\/comments\/(\d+)$/);
      if (adminDeleteMatch && request.method === "DELETE") {
        return await adminDeleteComment(request, env, origin, Number(adminDeleteMatch[1]));
      }

      if (path === "/" && request.method === "POST") {
        return await signup(request, env, origin);
      }

      return json({ ok: false, error: "Not found" }, 404, origin);
    } catch (error) {
      console.error(error);
      return json({ ok: false, error: "Something went wrong. Please try again." }, 500, origin);
    }
  }
};
