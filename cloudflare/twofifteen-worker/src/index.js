const PRODUCT_CATALOG = {
  'outlaw-tee': {
    title: 'Outlaw Tee',
    colour: 'Black',
    retailPrice: 29.99,
    retailCurrency: 'GBP',
    skus: {
      S: 'CV001-BLK-S',
      M: 'CV001-BLK-M',
      L: 'CV001-BLK-L',
      XL: 'CV001-BLK-XL',
      '2XL': 'CV001-BLK-2XL',
      '3XL': 'CV001-BLK-3XL',
      '4XL': 'CV001-BLK-4XL'
    },
    designs: [
      {
        title: 'DTG Printing Front Side',
        src: 'https://ragebaitapparel.co.uk/print/outlaw-front.png'
      },
      {
        title: 'DTG Printing Back Side',
        src: 'https://ragebaitapparel.co.uk/print/outlaw-back.png'
      }
    ]
  }
};

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer'
};

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === 'GET' && url.pathname === '/health') {
        return json({
          ok: true,
          service: 'rage-bait-twofifteen',
          liveSubmissionEnabled: env.ALLOW_LIVE_SUBMISSION === 'true',
          apiConfigured: Boolean(env.TWOFIFTEEN_APP_ID && env.TWOFIFTEEN_SECRET_KEY),
          databaseConfigured: Boolean(env.DB)
        });
      }

      if (request.method !== 'POST' || !['/validate', '/orders'].includes(url.pathname)) {
        return json({ ok: false, error: 'Not found' }, 404);
      }

      // This endpoint is deliberately server-to-server only. The public storefront
      // must never contain FULFILMENT_API_KEY or call this Worker directly.
      if (request.headers.get('Origin')) {
        return json({ ok: false, error: 'Direct browser order submission is disabled' }, 403);
      }

      if (!authorised(request, env.FULFILMENT_API_KEY)) {
        return json({ ok: false, error: 'Unauthorized' }, 401);
      }

      const contentType = request.headers.get('content-type') || '';
      if (!contentType.toLowerCase().includes('application/json')) {
        return json({ ok: false, error: 'Content-Type must be application/json' }, 415);
      }

      const raw = await request.text();
      if (!raw || raw.length > 32_000) {
        return json({ ok: false, error: 'Invalid request size' }, 413);
      }

      let incoming;
      try {
        incoming = JSON.parse(raw);
      } catch {
        return json({ ok: false, error: 'Invalid JSON' }, 400);
      }

      const validation = validateIncomingOrder(incoming);
      if (!validation.ok) {
        return json({ ok: false, error: validation.error }, 400);
      }

      const payload = buildTwoFifteenPayload(validation.order, env);

      if (url.pathname === '/validate') {
        return json({
          ok: true,
          live: false,
          message: 'Validated only. Nothing was sent to Two Fifteen.',
          payload
        });
      }

      if (env.ALLOW_LIVE_SUBMISSION !== 'true') {
        return json({
          ok: false,
          error: 'Live Two Fifteen submission is disabled',
          hint: 'Set ALLOW_LIVE_SUBMISSION=true only after a successful validation/test.'
        }, 503);
      }

      if (!env.TWOFIFTEEN_APP_ID || !env.TWOFIFTEEN_SECRET_KEY) {
        return json({ ok: false, error: 'Two Fifteen credentials are not configured' }, 503);
      }

      if (!env.DB) {
        return json({
          ok: false,
          error: 'Order database is not configured. Live submission is blocked to prevent duplicate fulfilment orders.'
        }, 503);
      }

      const existing = await env.DB.prepare(
        'SELECT external_id, status, response_json, updated_at FROM fulfilment_orders WHERE external_id = ?1'
      ).bind(validation.order.orderId).first();

      if (existing?.status === 'submitted') {
        return json({
          ok: true,
          duplicate: true,
          externalId: existing.external_id,
          status: existing.status,
          providerResponse: safeJson(existing.response_json)
        }, 200);
      }

      if (existing?.status === 'processing') {
        return json({
          ok: false,
          error: 'This order is already being processed',
          externalId: existing.external_id
        }, 409);
      }

      const requestJson = JSON.stringify(payload);
      const now = new Date().toISOString();

      if (existing) {
        await env.DB.prepare(
          `UPDATE fulfilment_orders
           SET status = 'processing', request_json = ?2, response_json = NULL, error = NULL, updated_at = ?3
           WHERE external_id = ?1`
        ).bind(validation.order.orderId, requestJson, now).run();
      } else {
        await env.DB.prepare(
          `INSERT INTO fulfilment_orders (external_id, status, request_json, created_at, updated_at)
           VALUES (?1, 'processing', ?2, ?3, ?3)`
        ).bind(validation.order.orderId, requestJson, now).run();
      }

      try {
        const provider = await submitToTwoFifteen(payload, env);

        await env.DB.prepare(
          `UPDATE fulfilment_orders
           SET status = 'submitted', response_json = ?2, updated_at = ?3
           WHERE external_id = ?1`
        ).bind(validation.order.orderId, provider.raw, new Date().toISOString()).run();

        return json({
          ok: true,
          externalId: validation.order.orderId,
          twoFifteen: provider.parsed
        }, 201);
      } catch (error) {
        await env.DB.prepare(
          `UPDATE fulfilment_orders
           SET status = 'failed', error = ?2, updated_at = ?3
           WHERE external_id = ?1`
        ).bind(validation.order.orderId, redactError(error), new Date().toISOString()).run();
        throw error;
      }
    } catch (error) {
      console.error('Two Fifteen fulfilment error:', redactError(error));
      return json({
        ok: false,
        error: 'Fulfilment request failed',
        detail: redactError(error)
      }, 502);
    }
  }
};

function validateIncomingOrder(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    return fail('Request body must be an object');
  }

  const orderId = clean(input.orderId, 80);
  if (!orderId || !/^[A-Za-z0-9._:-]{4,80}$/.test(orderId)) {
    return fail('orderId must be 4-80 characters using letters, numbers, dot, dash, underscore or colon');
  }

  const buyerEmail = clean(input.buyerEmail, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
    return fail('A valid buyerEmail is required');
  }

  const address = input.shippingAddress;
  if (!address || typeof address !== 'object' || Array.isArray(address)) {
    return fail('shippingAddress is required');
  }

  const shippingAddress = {
    firstName: clean(address.firstName, 80),
    lastName: clean(address.lastName, 80),
    company: clean(address.company, 120),
    address1: clean(address.address1, 160),
    address2: clean(address.address2, 160),
    city: clean(address.city, 100),
    county: clean(address.county, 100),
    postcode: clean(address.postcode, 32),
    country: clean(address.country, 80),
    phone1: clean(address.phone1, 40),
    phone2: clean(address.phone2, 40)
  };

  for (const field of ['firstName', 'lastName', 'address1', 'city', 'postcode', 'country']) {
    if (!shippingAddress[field]) return fail(`shippingAddress.${field} is required`);
  }

  if (!Array.isArray(input.items) || input.items.length < 1 || input.items.length > 5) {
    return fail('items must contain between 1 and 5 line items');
  }

  const items = [];
  for (const item of input.items) {
    if (!item || typeof item !== 'object') return fail('Each item must be an object');

    const product = clean(item.product, 40).toLowerCase();
    const catalog = PRODUCT_CATALOG[product];
    if (!catalog) return fail(`Unsupported product: ${product || '(missing)'}`);

    const size = clean(item.size, 8).toUpperCase();
    if (!catalog.skus[size]) return fail(`Unsupported size for ${product}: ${size || '(missing)'}`);

    const quantity = Number(item.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
      return fail('quantity must be an integer between 1 and 10');
    }

    items.push({ product, size, quantity });
  }

  return {
    ok: true,
    order: { orderId, buyerEmail, shippingAddress, items }
  };
}

function buildTwoFifteenPayload(order, env) {
  return {
    external_id: order.orderId,
    brand: env.TWOFIFTEEN_BRAND || 'Rage Bait Apparel',
    channel: 'site',
    buyer_email: order.buyerEmail,
    shipping_address: order.shippingAddress,
    items: order.items.map((item, index) => {
      const catalog = PRODUCT_CATALOG[item.product];
      return {
        id: index,
        pn: catalog.skus[item.size],
        external_id: `OUTLAW-TEE-BLK-${item.size}`,
        title: `${catalog.title} - ${catalog.colour} - ${item.size}`,
        retailPrice: catalog.retailPrice,
        retailCurrency: catalog.retailCurrency,
        quantity: item.quantity,
        description: 'Rage Bait Apparel Outlaw Tee',
        designs: catalog.designs
      };
    }),
    comments: `Rage Bait Apparel website order ${order.orderId}`
  };
}

async function submitToTwoFifteen(payload, env) {
  // Two Fifteen requires SHA1(request body + Secret Key). The exact JSON string
  // signed below is the exact same string sent in the POST request.
  const body = JSON.stringify(payload);
  const signature = await sha1Hex(body + env.TWOFIFTEEN_SECRET_KEY);
  const apiBase = (env.TWOFIFTEEN_API_BASE || 'https://www.twofifteen.co.uk/api').replace(/\/$/, '');
  const endpoint = new URL(`${apiBase}/orders.php`);
  endpoint.searchParams.set('AppId', env.TWOFIFTEEN_APP_ID);
  endpoint.searchParams.set('Signature', signature);

  const response = await fetch(endpoint.toString(), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
      'user-agent': 'Rage-Bait-Apparel-Fulfilment/1.0'
    },
    body
  });

  const raw = await response.text();
  const parsed = safeJson(raw) ?? { raw };

  if (!response.ok) {
    const error = new Error(`Two Fifteen API returned HTTP ${response.status}`);
    error.providerStatus = response.status;
    error.providerBody = raw.slice(0, 2000);
    throw error;
  }

  return { raw, parsed };
}

async function sha1Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return [...new Uint8Array(digest)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function authorised(request, expected) {
  if (!expected) return false;
  const header = request.headers.get('authorization') || '';
  const supplied = header.startsWith('Bearer ') ? header.slice(7) : '';
  return constantTimeEqual(supplied, expected);
}

function constantTimeEqual(a, b) {
  const aa = new TextEncoder().encode(String(a));
  const bb = new TextEncoder().encode(String(b));
  let diff = aa.length ^ bb.length;
  const length = Math.max(aa.length, bb.length);
  for (let i = 0; i < length; i++) {
    diff |= (aa[i] || 0) ^ (bb[i] || 0);
  }
  return diff === 0;
}

function clean(value, max) {
  if (value === undefined || value === null) return '';
  return String(value).trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);
}

function fail(error) {
  return { ok: false, error };
}

function safeJson(value) {
  if (!value) return null;
  try { return JSON.parse(value); } catch { return null; }
}

function redactError(error) {
  if (!error) return 'Unknown error';
  const status = error.providerStatus ? ` (HTTP ${error.providerStatus})` : '';
  const provider = error.providerBody ? `: ${String(error.providerBody).slice(0, 500)}` : '';
  return `${error.message || String(error)}${status}${provider}`;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS
  });
}
