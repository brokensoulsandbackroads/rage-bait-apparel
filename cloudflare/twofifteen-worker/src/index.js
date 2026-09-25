const PRODUCT_CATALOG = {
  'outlaw-tee': {
    title:'Outlaw Tee', colour:'Black', retailCurrency:'GBP', basePrice:29.99,
    skus:{S:'CV001-BLK-S',M:'CV001-BLK-M',L:'CV001-BLK-L',XL:'CV001-BLK-XL','2XL':'CV001-BLK-2XL','3XL':'CV001-BLK-3XL','4XL':'CV001-BLK-4XL'},
    designs:[
      {title:'DTG Printing Front Side',src:'https://ragebaitapparel.co.uk/print/outlaw-front.png'},
      {title:'DTG Printing Back Side',src:'https://ragebaitapparel.co.uk/print/outlaw-back.png'}
    ]
  },
  'virtual-degenerate-tee': {
    title:'Virtual Degenerate Tee', colour:'Black', retailCurrency:'GBP', basePrice:29.99,
    skus:{S:'CV001-BLK-S',M:'CV001-BLK-M',L:'CV001-BLK-L',XL:'CV001-BLK-XL','2XL':'CV001-BLK-2XL','3XL':'CV001-BLK-3XL','4XL':'CV001-BLK-4XL'},
    designs:[
      {title:'DTG Printing Front Side',src:'https://ragebaitapparel.co.uk/print/virtual-degenerate-tee-front.png'},
      {title:'DTG Printing Back Side',src:'https://ragebaitapparel.co.uk/print/virtual-degenerate-back.png'}
    ]
  },
  'virtual-degenerate-hoodie': {
    title:'Virtual Degenerate Hoodie', colour:'Deep Black', retailCurrency:'GBP', basePrice:44.99,
    sizePrices:{'3XL':45.99,'4XL':45.99,'5XL':45.99},
    skus:{XS:'JH001-DBK-XS',S:'JH001-DBK-S',M:'JH001-DBK-M',L:'JH001-DBK-L',XL:'JH001-DBK-XL','2XL':'JH001-DBK-2XL','3XL':'JH001-DBK-3XL','4XL':'JH001-DBK-4XL','5XL':'JH001-DBK-5XL'},
    designs:[
      {title:'DTG Printing Front Side',src:'https://ragebaitapparel.co.uk/print/virtual-degenerate-front.png'},
      {title:'DTG Printing Back Side',src:'https://ragebaitapparel.co.uk/print/virtual-degenerate-back.png'}
    ]
  },
  'outlaw-hoodie': {
    title:'Outlaw Hoodie', colour:'Deep Black', retailCurrency:'GBP', basePrice:44.99,
    sizePrices:{'3XL':45.99,'4XL':45.99,'5XL':45.99},
    skus:{XS:'JH001-DBK-XS',S:'JH001-DBK-S',M:'JH001-DBK-M',L:'JH001-DBK-L',XL:'JH001-DBK-XL','2XL':'JH001-DBK-2XL','3XL':'JH001-DBK-3XL','4XL':'JH001-DBK-4XL','5XL':'JH001-DBK-5XL'},
    designs:[
      {title:'DTG Printing Front Side',src:'https://ragebaitapparel.co.uk/print/outlaw-hood-front.png'},
      {title:'DTG Printing Back Side',src:'https://ragebaitapparel.co.uk/print/outlaw-back.png'}
    ]
  }
};

const EU_CODES = new Set(['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE']);
const COUNTRY_NAMES = {
  GB: 'United Kingdom', AT: 'Austria', BE: 'Belgium', BG: 'Bulgaria', HR: 'Croatia', CY: 'Cyprus', CZ: 'Czechia',
  DK: 'Denmark', EE: 'Estonia', FI: 'Finland', FR: 'France', DE: 'Germany', GR: 'Greece', HU: 'Hungary', IE: 'Ireland',
  IT: 'Italy', LV: 'Latvia', LT: 'Lithuania', LU: 'Luxembourg', MT: 'Malta', NL: 'Netherlands', PL: 'Poland', PT: 'Portugal',
  RO: 'Romania', SK: 'Slovakia', SI: 'Slovenia', ES: 'Spain', SE: 'Sweden', US: 'United States', CA: 'Canada', AU: 'Australia',
  NZ: 'New Zealand', JP: 'Japan', NO: 'Norway', CH: 'Switzerland'
};
const SHIPPING_GBP = { UK: 3.59, EU: 9.54, ROW: 11.16 };
const ALLOWED_CHECKOUT_ORIGINS = new Set(['https://ragebaitapparel.co.uk', 'https://www.ragebaitapparel.co.uk']);

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer'
};

let paypalTokenCache = { token: '', expiresAt: 0, mode: '' };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';

    if (request.method === 'OPTIONS' && url.pathname.startsWith('/checkout/')) {
      return checkoutPreflight(origin);
    }

    try {
      if (request.method === 'GET' && url.pathname === '/health') {
        return json({
          ok: true,
          service: 'rage-bait-twofifteen',
          liveSubmissionEnabled: env.ALLOW_LIVE_SUBMISSION === 'true',
          checkoutEnabled: env.CHECKOUT_ENABLED === 'true',
          paypalMode: env.PAYPAL_MODE || 'sandbox',
          paypalConfigured: Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET),
          apiConfigured: Boolean(env.TWOFIFTEEN_APP_ID && env.TWOFIFTEEN_SECRET_KEY),
          emailConfigured: Boolean(env.RESEND_API_KEY),
          databaseConfigured: Boolean(env.DB)
        });
      }

      if (url.pathname.startsWith('/checkout/')) {
        if (!ALLOWED_CHECKOUT_ORIGINS.has(origin)) {
          return corsJson({ ok: false, error: 'Checkout origin not allowed' }, 403, origin);
        }

        if (request.method === 'GET' && url.pathname === '/checkout/config') {
          const enabled = checkoutReady(env);
          return corsJson({
            ok: true,
            enabled,
            currency: 'GBP',
            paypalClientId: enabled ? env.PAYPAL_CLIENT_ID : '',
            paypalMode: env.PAYPAL_MODE || 'sandbox',
            message: enabled ? 'Secure checkout ready.' : 'Checkout is not live yet. Payment cannot be taken until PayPal and fulfilment are fully enabled.'
          }, 200, origin);
        }

        if (request.method === 'POST' && url.pathname === '/checkout/create') {
          return handleCheckoutCreate(request, env, origin);
        }

        if (request.method === 'POST' && url.pathname === '/checkout/capture') {
          return handleCheckoutCapture(request, env, origin);
        }

        return corsJson({ ok: false, error: 'Not found' }, 404, origin);
      }

      if (request.method !== 'POST' || !['/validate', '/orders'].includes(url.pathname)) {
        return json({ ok: false, error: 'Not found' }, 404);
      }

      // These endpoints are server-to-server only.
      if (request.headers.get('Origin')) {
        return json({ ok: false, error: 'Direct browser order submission is disabled' }, 403);
      }

      if (!authorised(request, env.FULFILMENT_API_KEY)) {
        return json({ ok: false, error: 'Unauthorized' }, 401);
      }

      const incoming = await readJson(request);
      const validation = validateIncomingOrder(incoming);
      if (!validation.ok) return json({ ok: false, error: validation.error }, 400);

      const payload = buildTwoFifteenPayload(validation.order, env);
      if (url.pathname === '/validate') {
        return json({ ok: true, live: false, message: 'Validated only. Nothing was sent to Two Fifteen.', payload });
      }

      const result = await fulfilOrder(validation.order, env);
      return json({ ok: true, externalId: validation.order.orderId, duplicate: result.duplicate, twoFifteen: result.provider?.parsed ?? null }, result.duplicate ? 200 : 201);
    } catch (error) {
      console.error('Rage Bait order service error:', redactError(error));
      if (url.pathname.startsWith('/checkout/')) {
        return corsJson({ ok: false, error: 'Checkout request failed. Please try again.' }, 502, origin);
      }
      return json({ ok: false, error: 'Fulfilment request failed', detail: redactError(error) }, 502);
    }
  }
};

async function handleCheckoutCreate(request, env, origin) {
  if (!checkoutReady(env)) {
    return corsJson({ ok: false, error: 'Checkout is not live yet.' }, 503, origin);
  }

  let incoming;
  try { incoming = await readJson(request); }
  catch (error) { return corsJson({ ok: false, error: error.message }, error.status || 400, origin); }

  const validation = validateCheckoutOrder(incoming);
  if (!validation.ok) return corsJson({ ok: false, error: validation.error }, 400, origin);

  const summary = calculateSummary(validation.order.items, validation.countryCode);
  const checkoutId = newCheckoutId();

  let paypal;
  try {
    paypal = await createPayPalOrder({ checkoutId, ...validation, summary }, env);
  } catch (error) {
    console.error('PayPal create order failed:', redactError(error));
    return corsJson({ ok: false, error: 'PayPal could not start the payment. Please try again.' }, 502, origin);
  }

  const now = new Date().toISOString();
  await env.DB.prepare(
    `INSERT INTO checkout_orders
      (checkout_id, paypal_order_id, status, buyer_email, shipping_json, items_json, subtotal_gbp, shipping_gbp, total_gbp, created_at, updated_at)
     VALUES (?1, ?2, 'created', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?9)`
  ).bind(
    checkoutId,
    paypal.id,
    validation.order.buyerEmail,
    JSON.stringify(validation.checkoutShipping),
    JSON.stringify(validation.order.items),
    summary.subtotal,
    summary.shipping,
    summary.total,
    now
  ).run();

  return corsJson({
    ok: true,
    orderNumber: checkoutId,
    paypalOrderId: paypal.id,
    summary
  }, 201, origin);
}

async function handleCheckoutCapture(request, env, origin) {
  if (!checkoutReady(env)) {
    return corsJson({ ok: false, error: 'Checkout is not live yet.' }, 503, origin);
  }

  let incoming;
  try { incoming = await readJson(request); }
  catch (error) { return corsJson({ ok: false, error: error.message }, error.status || 400, origin); }

  const paypalOrderId = clean(incoming?.paypalOrderId, 40).toUpperCase();
  if (!/^[A-Z0-9]{5,40}$/.test(paypalOrderId)) {
    return corsJson({ ok: false, error: 'Invalid PayPal order ID' }, 400, origin);
  }

  const stored = await env.DB.prepare(
    `SELECT checkout_id, paypal_order_id, status, buyer_email, shipping_json, items_json,
            subtotal_gbp, shipping_gbp, total_gbp, paypal_capture_id
     FROM checkout_orders WHERE paypal_order_id = ?1`
  ).bind(paypalOrderId).first();

  if (!stored) return corsJson({ ok: false, error: 'Checkout order not found' }, 404, origin);
  if (stored.status === 'fulfilled') {
    return corsJson({ ok: true, duplicate: true, orderNumber: stored.checkout_id }, 200, origin);
  }

  let captureId = stored.paypal_capture_id || '';
  let paymentCaptured = ['captured', 'paid_fulfilment_failed'].includes(stored.status);

  if (!paymentCaptured) {
    let capture;
    try {
      capture = await capturePayPalOrder(paypalOrderId, stored.checkout_id, env);
    } catch (error) {
      console.error('PayPal capture failed:', redactError(error));
      return corsJson({ ok: false, paymentCaptured: false, error: 'PayPal could not confirm the payment. Please try again.' }, 502, origin);
    }

    const captured = extractCapture(capture);
    const expected = Number(stored.total_gbp);
    if (!captured || captured.status !== 'COMPLETED' || captured.currency !== 'GBP' || Math.abs(captured.value - expected) > 0.001) {
      console.error('PayPal capture verification failed', { checkoutId: stored.checkout_id, captured, expected });
      return corsJson({ ok: false, paymentCaptured: captured?.status === 'COMPLETED', error: 'Payment verification failed. Please contact us before trying again.' }, 502, origin);
    }

    captureId = captured.id;
    paymentCaptured = true;
    await env.DB.prepare(
      `UPDATE checkout_orders
       SET status = 'captured', paypal_capture_id = ?2, provider_response_json = ?3, updated_at = ?4
       WHERE checkout_id = ?1`
    ).bind(stored.checkout_id, captureId, JSON.stringify(capture).slice(0, 20000), new Date().toISOString()).run();
  }

  const checkoutShipping = safeJson(stored.shipping_json);
  const items = safeJson(stored.items_json);
  const order = {
    orderId: stored.checkout_id,
    buyerEmail: stored.buyer_email,
    shippingAddress: toTwoFifteenAddress(checkoutShipping),
    items
  };

  try {
    const fulfilment = await fulfilOrder(order, env);

    const summary = {
      subtotal: Number(stored.subtotal_gbp),
      shipping: Number(stored.shipping_gbp),
      total: Number(stored.total_gbp),
      currency: 'GBP'
    };

    let confirmationEmailSent = false;
    try {
      const emailResult = await sendOrderConfirmation({
        orderNumber: stored.checkout_id,
        buyerEmail: stored.buyer_email,
        checkoutShipping,
        items,
        summary,
        captureId
      }, env);
      confirmationEmailSent = Boolean(emailResult?.id);
    } catch (emailError) {
      console.error('Order confirmation email failed:', redactError(emailError));
    }

    await env.DB.prepare(
      `UPDATE checkout_orders
       SET status = 'fulfilled', error = NULL, updated_at = ?2
       WHERE checkout_id = ?1`
    ).bind(stored.checkout_id, new Date().toISOString()).run();

    return corsJson({
      ok: true,
      paymentCaptured: true,
      captureId,
      orderNumber: stored.checkout_id,
      fulfilmentQueued: true,
      confirmationEmailSent,
      duplicate: fulfilment.duplicate
    }, 200, origin);
  } catch (error) {
    console.error('Paid order fulfilment failed:', redactError(error));
    await env.DB.prepare(
      `UPDATE checkout_orders
       SET status = 'paid_fulfilment_failed', error = ?2, updated_at = ?3
       WHERE checkout_id = ?1`
    ).bind(stored.checkout_id, redactError(error), new Date().toISOString()).run();

    return corsJson({
      ok: false,
      paymentCaptured: true,
      orderNumber: stored.checkout_id,
      error: 'Payment was received, but automatic fulfilment needs attention. Do not pay again.'
    }, 502, origin);
  }
}

function checkoutReady(env) {
  return env.CHECKOUT_ENABLED === 'true' &&
    env.ALLOW_LIVE_SUBMISSION === 'true' &&
    Boolean(env.PAYPAL_CLIENT_ID && env.PAYPAL_CLIENT_SECRET) &&
    Boolean(env.TWOFIFTEEN_APP_ID && env.TWOFIFTEEN_SECRET_KEY) &&
    Boolean(env.RESEND_API_KEY) &&
    Boolean(env.DB);
}

function validateCheckoutOrder(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('Invalid checkout request');

  const buyerEmail = clean(input.buyerEmail, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) return fail('A valid email address is required');

  const address = input.shippingAddress;
  if (!address || typeof address !== 'object' || Array.isArray(address)) return fail('Delivery address is required');

  const countryCode = clean(address.countryCode, 2).toUpperCase();
  if (!COUNTRY_NAMES[countryCode]) return fail('This delivery country is not supported yet');

  const checkoutShipping = {
    firstName: clean(address.firstName, 80),
    lastName: clean(address.lastName, 80),
    company: '',
    address1: clean(address.address1, 160),
    address2: clean(address.address2, 160),
    city: clean(address.city, 100),
    county: clean(address.county, 100),
    postcode: clean(address.postcode, 32),
    countryCode,
    country: COUNTRY_NAMES[countryCode],
    phone1: clean(address.phone1, 40),
    phone2: ''
  };

  for (const field of ['firstName','lastName','address1','city','postcode','phone1']) {
    if (!checkoutShipping[field]) return fail(`Delivery ${field} is required`);
  }

  const itemValidation = validateItems(input.items);
  if (!itemValidation.ok) return itemValidation;

  return {
    ok: true,
    countryCode,
    checkoutShipping,
    order: {
      buyerEmail,
      shippingAddress: toTwoFifteenAddress(checkoutShipping),
      items: itemValidation.items
    }
  };
}

function validateIncomingOrder(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return fail('Request body must be an object');

  const orderId = clean(input.orderId, 80);
  if (!orderId || !/^[A-Za-z0-9._:-]{4,80}$/.test(orderId)) {
    return fail('orderId must be 4-80 characters using letters, numbers, dot, dash, underscore or colon');
  }

  const buyerEmail = clean(input.buyerEmail, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) return fail('A valid buyerEmail is required');

  const address = input.shippingAddress;
  if (!address || typeof address !== 'object' || Array.isArray(address)) return fail('shippingAddress is required');

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
  for (const field of ['firstName','lastName','address1','city','postcode','country']) {
    if (!shippingAddress[field]) return fail(`shippingAddress.${field} is required`);
  }

  const itemValidation = validateItems(input.items);
  if (!itemValidation.ok) return itemValidation;

  return { ok: true, order: { orderId, buyerEmail, shippingAddress, items: itemValidation.items } };
}

function validateItems(inputItems) {
  if (!Array.isArray(inputItems) || inputItems.length < 1 || inputItems.length > 10) {
    return fail('items must contain between 1 and 10 line items');
  }

  const items = [];
  for (const item of inputItems) {
    if (!item || typeof item !== 'object') return fail('Each item must be an object');
    const product = clean(item.product, 40).toLowerCase();
    const catalog = PRODUCT_CATALOG[product];
    if (!catalog) return fail(`Unsupported product: ${product || '(missing)'}`);

    const size = clean(item.size, 8).toUpperCase();
    if (!catalog.skus[size]) return fail(`Unsupported size for ${product}: ${size || '(missing)'}`);

    const quantity = Number(item.quantity ?? 1);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) return fail('quantity must be an integer between 1 and 10');
    items.push({ product, size, quantity });
  }
  return { ok: true, items };
}

function calculateSummary(items, countryCode) {
  const subtotal = roundMoney(items.reduce((sum, item) => {
    const catalog = PRODUCT_CATALOG[item.product];
    return sum + priceForSize(catalog, item.size) * item.quantity;
  }, 0));
  const shipping = countryCode === 'GB' ? SHIPPING_GBP.UK : EU_CODES.has(countryCode) ? SHIPPING_GBP.EU : SHIPPING_GBP.ROW;
  return { subtotal, shipping, total: roundMoney(subtotal + shipping), currency: 'GBP' };
}

function priceForSize(catalog, size) {
  return Number(catalog.sizePrices?.[size] ?? catalog.basePrice);
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
        external_id: `${item.product.toUpperCase().replace(/[^A-Z0-9]+/g, '-')}-${item.size}`,
        title: `${catalog.title} - ${catalog.colour} - ${item.size}`,
        retailPrice: priceForSize(catalog, item.size),
        retailCurrency: catalog.retailCurrency,
        quantity: item.quantity,
        description: `Rage Bait Apparel ${catalog.title}`,
        designs: catalog.designs
      };
    }),
    comments: `Rage Bait Apparel website order ${order.orderId}`
  };
}

async function fulfilOrder(order, env) {
  if (env.ALLOW_LIVE_SUBMISSION !== 'true') throw new Error('Live Two Fifteen submission is disabled');
  if (!env.TWOFIFTEEN_APP_ID || !env.TWOFIFTEEN_SECRET_KEY) throw new Error('Two Fifteen credentials are not configured');
  if (!env.DB) throw new Error('Order database is not configured');

  const payload = buildTwoFifteenPayload(order, env);
  const existing = await env.DB.prepare(
    'SELECT external_id, status, response_json FROM fulfilment_orders WHERE external_id = ?1'
  ).bind(order.orderId).first();

  if (existing?.status === 'submitted') {
    return { duplicate: true, provider: { parsed: safeJson(existing.response_json), raw: existing.response_json || '' } };
  }
  if (existing?.status === 'processing') throw new Error('This order is already being processed');

  const requestJson = JSON.stringify(payload);
  const now = new Date().toISOString();
  if (existing) {
    await env.DB.prepare(
      `UPDATE fulfilment_orders
       SET status = 'processing', request_json = ?2, response_json = NULL, error = NULL, updated_at = ?3
       WHERE external_id = ?1`
    ).bind(order.orderId, requestJson, now).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO fulfilment_orders (external_id, status, request_json, created_at, updated_at)
       VALUES (?1, 'processing', ?2, ?3, ?3)`
    ).bind(order.orderId, requestJson, now).run();
  }

  try {
    const provider = await submitToTwoFifteen(payload, env);
    await env.DB.prepare(
      `UPDATE fulfilment_orders
       SET status = 'submitted', response_json = ?2, updated_at = ?3
       WHERE external_id = ?1`
    ).bind(order.orderId, provider.raw, new Date().toISOString()).run();
    return { duplicate: false, provider };
  } catch (error) {
    await env.DB.prepare(
      `UPDATE fulfilment_orders
       SET status = 'failed', error = ?2, updated_at = ?3
       WHERE external_id = ?1`
    ).bind(order.orderId, redactError(error), new Date().toISOString()).run();
    throw error;
  }
}

async function createPayPalOrder({ checkoutId, order, checkoutShipping, summary }, env) {
  const accessToken = await getPayPalAccessToken(env);
  const endpoint = `${paypalApiBase(env)}/v2/checkout/orders`;
  const payload = {
    intent: 'CAPTURE',
    payer: {
      email_address: order.buyerEmail,
      name: { given_name: checkoutShipping.firstName, surname: checkoutShipping.lastName }
    },
    purchase_units: [{
      reference_id: checkoutId,
      custom_id: checkoutId,
      description: 'Rage Bait Apparel order',
      amount: {
        currency_code: 'GBP',
        value: moneyString(summary.total),
        breakdown: {
          item_total: { currency_code: 'GBP', value: moneyString(summary.subtotal) },
          shipping: { currency_code: 'GBP', value: moneyString(summary.shipping) }
        }
      },
      items: order.items.map(item => {
        const catalog = PRODUCT_CATALOG[item.product];
        return {
          name: `${catalog.title} - ${item.size}`,
          sku: catalog.skus[item.size],
          quantity: String(item.quantity),
          category: 'PHYSICAL_GOODS',
          unit_amount: { currency_code: 'GBP', value: moneyString(priceForSize(catalog, item.size)) }
        };
      }),
      shipping: {
        name: { full_name: `${checkoutShipping.firstName} ${checkoutShipping.lastName}` },
        address: {
          address_line_1: checkoutShipping.address1,
          ...(checkoutShipping.address2 ? { address_line_2: checkoutShipping.address2 } : {}),
          admin_area_2: checkoutShipping.city,
          ...(checkoutShipping.county ? { admin_area_1: checkoutShipping.county } : {}),
          postal_code: checkoutShipping.postcode,
          country_code: checkoutShipping.countryCode
        }
      }
    }],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: 'Rage Bait Apparel',
          shipping_preference: 'SET_PROVIDED_ADDRESS',
          user_action: 'PAY_NOW',
          return_url: 'https://ragebaitapparel.co.uk/checkout.html',
          cancel_url: 'https://ragebaitapparel.co.uk/checkout.html?cancelled=1'
        }
      }
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${accessToken}`,
      'paypal-request-id': `create-${checkoutId}`,
      'prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  const raw = await response.text();
  const parsed = safeJson(raw);
  if (!response.ok || !parsed?.id) {
    const error = new Error(`PayPal create order failed with HTTP ${response.status}`);
    error.providerStatus = response.status;
    error.providerBody = raw.slice(0, 1500);
    throw error;
  }
  return parsed;
}

async function capturePayPalOrder(paypalOrderId, checkoutId, env) {
  const accessToken = await getPayPalAccessToken(env);
  const response = await fetch(`${paypalApiBase(env)}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${accessToken}`,
      'paypal-request-id': `capture-${checkoutId}`,
      'prefer': 'return=representation'
    },
    body: '{}'
  });
  const raw = await response.text();
  const parsed = safeJson(raw);
  if (!response.ok || !parsed) {
    const error = new Error(`PayPal capture failed with HTTP ${response.status}`);
    error.providerStatus = response.status;
    error.providerBody = raw.slice(0, 1500);
    throw error;
  }
  return parsed;
}

function extractCapture(paypalResponse) {
  const capture = paypalResponse?.purchase_units?.[0]?.payments?.captures?.[0];
  if (!capture) return null;
  return {
    id: capture.id || '',
    status: capture.status || '',
    currency: capture.amount?.currency_code || '',
    value: Number(capture.amount?.value)
  };
}

async function getPayPalAccessToken(env) {
  const mode = env.PAYPAL_MODE === 'live' ? 'live' : 'sandbox';
  if (paypalTokenCache.token && paypalTokenCache.mode === mode && Date.now() < paypalTokenCache.expiresAt) {
    return paypalTokenCache.token;
  }

  const credentials = btoa(`${env.PAYPAL_CLIENT_ID}:${env.PAYPAL_CLIENT_SECRET}`);
  const response = await fetch(`${paypalApiBase(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'authorization': `Basic ${credentials}`,
      'content-type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const raw = await response.text();
  const data = safeJson(raw);
  if (!response.ok || !data?.access_token) {
    const error = new Error(`PayPal authentication failed with HTTP ${response.status}`);
    error.providerStatus = response.status;
    error.providerBody = raw.slice(0, 1000);
    throw error;
  }

  const ttl = Math.max(60, Number(data.expires_in || 300) - 60);
  paypalTokenCache = { token: data.access_token, expiresAt: Date.now() + ttl * 1000, mode };
  return data.access_token;
}

function paypalApiBase(env) {
  return env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
}

async function submitToTwoFifteen(payload, env) {
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
      'user-agent': 'Rage-Bait-Apparel-Fulfilment/2.0'
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

async function sendOrderConfirmation({ orderNumber, buyerEmail, checkoutShipping, items, summary, captureId }, env) {
  if (!env.RESEND_API_KEY) throw new Error('Resend API key is not configured');

  const from = env.ORDER_EMAIL_FROM || 'Rage Bait Apparel <orders@ragebaitapparel.co.uk>';
  const replyTo = env.ORDER_EMAIL_REPLY_TO || 'crew@ragebaitapparel.co.uk';
  const subject = `Order confirmed: ${orderNumber} | Rage Bait Apparel`;
  const html = buildOrderConfirmationHtml({ orderNumber, checkoutShipping, items, summary, captureId });
  const text = buildOrderConfirmationText({ orderNumber, checkoutShipping, items, summary, captureId });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${env.RESEND_API_KEY}`,
      'idempotency-key': `order-confirmation/${orderNumber}`
    },
    body: JSON.stringify({
      from,
      to: [buyerEmail],
      reply_to: replyTo,
      subject,
      html,
      text
    })
  });

  const raw = await response.text();
  const parsed = safeJson(raw);
  if (!response.ok || !parsed?.id) {
    const error = new Error(`Resend order confirmation failed with HTTP ${response.status}`);
    error.providerStatus = response.status;
    error.providerBody = raw.slice(0, 1500);
    throw error;
  }

  return parsed;
}

function buildOrderConfirmationHtml({ orderNumber, checkoutShipping, items, summary, captureId }) {
  const itemRows = items.map(item => {
    const catalog = PRODUCT_CATALOG[item.product];
    const unitPrice = priceForSize(catalog, item.size);
    const lineTotal = unitPrice * item.quantity;
    return `<tr>
      <td style="padding:12px 0;border-bottom:1px solid #2b302a;color:#ffffff;">
        <strong>${escapeHtml(catalog.title)}</strong><br>
        <span style="color:#9aa197;font-size:13px;">${escapeHtml(catalog.colour)} · ${escapeHtml(item.size)} · Qty ${item.quantity}</span>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #2b302a;color:#b8ff00;text-align:right;font-weight:800;">£${moneyString(lineTotal)}</td>
    </tr>`;
  }).join('');

  const addressLines = [
    `${checkoutShipping.firstName || ''} ${checkoutShipping.lastName || ''}`.trim(),
    checkoutShipping.address1,
    checkoutShipping.address2,
    checkoutShipping.city,
    checkoutShipping.county,
    checkoutShipping.postcode,
    checkoutShipping.country
  ].filter(Boolean).map(escapeHtml).join('<br>');

  return `<!doctype html>
<html>
<body style="margin:0;background:#080908;color:#ffffff;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:32px 20px;">
    <div style="border:1px solid #2b302a;background:#101210;padding:28px;">
      <div style="font-size:12px;letter-spacing:2px;color:#b8ff00;font-weight:800;">RAGE BAIT APPAREL</div>
      <h1 style="margin:8px 0 8px;font-size:34px;line-height:1;color:#ffffff;">ORDER CONFIRMED</h1>
      <p style="margin:0 0 24px;color:#b8beb5;line-height:1.6;">Thanks for your order. Payment has been confirmed and your order has been sent for fulfilment.</p>

      <div style="background:#080908;border-left:4px solid #b8ff00;padding:14px 16px;margin-bottom:24px;">
        <div style="font-size:11px;color:#9aa197;text-transform:uppercase;letter-spacing:1px;">Order number</div>
        <div style="font-size:20px;color:#ffffff;font-weight:800;margin-top:4px;">${escapeHtml(orderNumber)}</div>
      </div>

      <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:22px;">${itemRows}</table>

      <table role="presentation" style="width:100%;border-collapse:collapse;margin-bottom:24px;color:#c8cec5;">
        <tr><td style="padding:5px 0;">Subtotal</td><td style="padding:5px 0;text-align:right;">£${moneyString(summary.subtotal)}</td></tr>
        <tr><td style="padding:5px 0;">Shipping</td><td style="padding:5px 0;text-align:right;">£${moneyString(summary.shipping)}</td></tr>
        <tr><td style="padding:10px 0 0;font-size:18px;font-weight:800;color:#ffffff;">Total</td><td style="padding:10px 0 0;text-align:right;font-size:20px;font-weight:900;color:#b8ff00;">£${moneyString(summary.total)}</td></tr>
      </table>

      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #2b302a;">
        <div style="font-size:11px;color:#9aa197;text-transform:uppercase;letter-spacing:1px;margin-bottom:7px;">Delivery address</div>
        <div style="color:#ffffff;line-height:1.6;">${addressLines}</div>
      </div>

      <p style="margin:24px 0 0;color:#9aa197;font-size:12px;line-height:1.6;">Payment reference: ${escapeHtml(captureId || 'Confirmed')}</p>
      <p style="margin:18px 0 0;color:#c8cec5;line-height:1.6;">Questions about your order? Reply to this email or contact <a href="mailto:crew@ragebaitapparel.co.uk" style="color:#b8ff00;">crew@ragebaitapparel.co.uk</a>.</p>
    </div>
    <p style="margin:18px 0 0;text-align:center;color:#697066;font-size:11px;line-height:1.6;">Rage Bait Apparel · A trading brand of Broken Souls &amp; Backroads<br>Tony Stanton, sole trader · 7 Marlborough Gardens, Faringdon, Oxfordshire, SN7 7DE, United Kingdom</p>
  </div>
</body>
</html>`;
}

function buildOrderConfirmationText({ orderNumber, checkoutShipping, items, summary, captureId }) {
  const itemLines = items.map(item => {
    const catalog = PRODUCT_CATALOG[item.product];
    const unitPrice = priceForSize(catalog, item.size);
    return `${catalog.title} - ${catalog.colour} - ${item.size} - Qty ${item.quantity} - £${moneyString(unitPrice * item.quantity)}`;
  }).join('\n');
  const address = [
    `${checkoutShipping.firstName || ''} ${checkoutShipping.lastName || ''}`.trim(),
    checkoutShipping.address1, checkoutShipping.address2, checkoutShipping.city,
    checkoutShipping.county, checkoutShipping.postcode, checkoutShipping.country
  ].filter(Boolean).join('\n');
  return `RAGE BAIT APPAREL\n\nORDER CONFIRMED\n\nOrder: ${orderNumber}\nPayment: Confirmed\nPayment reference: ${captureId || 'Confirmed'}\n\n${itemLines}\n\nSubtotal: £${moneyString(summary.subtotal)}\nShipping: £${moneyString(summary.shipping)}\nTotal: £${moneyString(summary.total)}\n\nDelivery address:\n${address}\n\nQuestions? crew@ragebaitapparel.co.uk`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function toTwoFifteenAddress(address) {
  return {
    firstName: clean(address?.firstName, 80),
    lastName: clean(address?.lastName, 80),
    company: clean(address?.company, 120),
    address1: clean(address?.address1, 160),
    address2: clean(address?.address2, 160),
    city: clean(address?.city, 100),
    county: clean(address?.county, 100),
    postcode: clean(address?.postcode, 32),
    country: clean(address?.country, 80),
    phone1: clean(address?.phone1, 40),
    phone2: clean(address?.phone2, 40)
  };
}

function newCheckoutId() {
  return `RBA-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}

async function readJson(request) {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    const error = new Error('Content-Type must be application/json');
    error.status = 415;
    throw error;
  }
  const raw = await request.text();
  if (!raw || raw.length > 32_000) {
    const error = new Error('Invalid request size');
    error.status = 413;
    throw error;
  }
  try { return JSON.parse(raw); }
  catch {
    const error = new Error('Invalid JSON');
    error.status = 400;
    throw error;
  }
}

async function sha1Hex(value) {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-1', bytes);
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
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
  for (let i = 0; i < length; i++) diff |= (aa[i] || 0) ^ (bb[i] || 0);
  return diff === 0;
}

function checkoutPreflight(origin) {
  if (!ALLOWED_CHECKOUT_ORIGINS.has(origin)) return new Response(null, { status: 403 });
  return new Response(null, { status: 204, headers: checkoutCorsHeaders(origin) });
}

function checkoutCorsHeaders(origin) {
  return {
    ...JSON_HEADERS,
    'access-control-allow-origin': ALLOWED_CHECKOUT_ORIGINS.has(origin) ? origin : 'https://ragebaitapparel.co.uk',
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'Content-Type',
    'access-control-max-age': '86400',
    'vary': 'Origin'
  };
}

function corsJson(body, status, origin) {
  return new Response(JSON.stringify(body), { status, headers: checkoutCorsHeaders(origin) });
}

function clean(value, max) {
  if (value === undefined || value === null) return '';
  return String(value).trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, max);
}

function fail(error) { return { ok: false, error }; }
function roundMoney(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
function moneyString(value) { return roundMoney(value).toFixed(2); }
function safeJson(value) { if (!value) return null; try { return JSON.parse(value); } catch { return null; } }

function redactError(error) {
  if (!error) return 'Unknown error';
  const status = error.providerStatus ? ` (HTTP ${error.providerStatus})` : '';
  const provider = error.providerBody ? `: ${String(error.providerBody).slice(0, 500)}` : '';
  return `${error.message || String(error)}${status}${provider}`;
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}
