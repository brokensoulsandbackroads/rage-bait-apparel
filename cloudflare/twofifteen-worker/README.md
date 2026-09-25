# Rage Bait Apparel → Two Fifteen Worker

Secure server-to-server fulfilment bridge for the Rage Bait Apparel storefront.

## What it does

- accepts authenticated server-to-server fulfilment requests
- supports the Outlaw Tee and Virtual Degenerate Hoodie
- validates customer/order fields, product and size
- ignores browser-supplied SKUs, prices and artwork URLs
- maps approved product sizes to trusted Two Fifteen SKUs server-side
- uses only the approved public print artwork URLs from the Rage Bait site
- signs the exact JSON body with `SHA1(request body + Two Fifteen Secret Key)`
- sends the signed request to `POST https://www.twofifteen.co.uk/api/orders.php`
- records fulfilment state in Cloudflare D1 to stop accidental duplicate orders
- keeps live submission disabled until explicitly enabled

## Outlaw Tee mapping

| Size | Two Fifteen SKU |
|---|---|
| S | `CV001-BLK-S` |
| M | `CV001-BLK-M` |
| L | `CV001-BLK-L` |
| XL | `CV001-BLK-XL` |
| 2XL | `CV001-BLK-2XL` |
| 3XL | `CV001-BLK-3XL` |
| 4XL | `CV001-BLK-4XL` |

Print files:

- `https://ragebaitapparel.co.uk/print/outlaw-front.png`
- `https://ragebaitapparel.co.uk/print/outlaw-back.png`

## Virtual Degenerate Hoodie mapping

Store product key: `virtual-degenerate-hoodie`

Colour: `Deep Black`

| Size | Two Fifteen SKU | Retail price |
|---|---|---:|
| XS | `JH001-DBK-XS` | £44.99 |
| S | `JH001-DBK-S` | £44.99 |
| M | `JH001-DBK-M` | £44.99 |
| L | `JH001-DBK-L` | £44.99 |
| XL | `JH001-DBK-XL` | £44.99 |
| 2XL | `JH001-DBK-2XL` | £44.99 |
| 3XL | `JH001-DBK-3XL` | £45.99 |
| 4XL | `JH001-DBK-4XL` | £45.99 |
| 5XL | `JH001-DBK-5XL` | £45.99 |

Approved print files:

- Front: `https://ragebaitapparel.co.uk/print/virtual-degenerate-front.png`
- Back: `https://ragebaitapparel.co.uk/print/virtual-degenerate-back.png`

The worker derives the Two Fifteen item title, description, external ID, price and artwork from the trusted server-side catalogue. The public browser does not supply those fulfilment values.

## Required Cloudflare secrets

Never commit these to GitHub.

```bash
wrangler secret put TWOFIFTEEN_SECRET_KEY
wrangler secret put FULFILMENT_API_KEY
```

For PayPal checkout, also configure:

```bash
wrangler secret put PAYPAL_CLIENT_ID
wrangler secret put PAYPAL_CLIENT_SECRET
```

`TWOFIFTEEN_SECRET_KEY` is the Secret Key from Two Fifteen API Settings.

`FULFILMENT_API_KEY` is a separate random token used to protect the server-to-server fulfilment routes. It must never be placed in public Rage Bait JavaScript.

## D1 duplicate protection

The worker uses the `rage-bait-orders` D1 database. Apply all migrations before enabling checkout or fulfilment:

```bash
wrangler d1 migrations apply rage-bait-orders --remote
```

Live fulfilment refuses to run without the D1 binding.

## Safe first deployment

`ALLOW_LIVE_SUBMISSION` and `CHECKOUT_ENABLED` are deliberately kept off until credentials, database migrations and a validation test are complete.

Deploy the Worker:

```bash
npm install
npm run deploy
```

Check health:

```bash
curl https://YOUR-WORKER.workers.dev/health
```

## Validate the Virtual Degenerate Hoodie without ordering it

```bash
curl -X POST https://YOUR-WORKER.workers.dev/validate \
  -H "Authorization: Bearer YOUR_FULFILMENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "RBA-HOODIE-TEST-001",
    "buyerEmail": "test@example.com",
    "shippingAddress": {
      "firstName": "Test",
      "lastName": "Customer",
      "company": "",
      "address1": "1 Test Street",
      "address2": "",
      "city": "Manchester",
      "county": "Greater Manchester",
      "postcode": "M1 1AA",
      "country": "United Kingdom",
      "phone1": "07123456789",
      "phone2": ""
    },
    "items": [
      {
        "product": "virtual-degenerate-hoodie",
        "size": "XL",
        "quantity": 1
      }
    ]
  }'
```

The `/validate` route returns the exact Two Fifteen payload but does not submit it.

## Enable live fulfilment

Only after validation and a controlled test:

```toml
ALLOW_LIVE_SUBMISSION = "true"
```

Then redeploy.

The public GitHub Pages storefront must not call the protected `/orders` endpoint directly. The production flow is:

```text
Customer checkout
      ↓
PayPal payment confirmed server-side
      ↓
Trusted checkout backend builds the approved product payload
      ↓
Worker validates + signs order
      ↓
Two Fifteen
```

This prevents unpaid or browser-forged requests from generating fulfilment orders.