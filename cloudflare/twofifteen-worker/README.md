# Rage Bait Apparel → Two Fifteen Worker

Secure server-to-server fulfilment bridge for the Rage Bait Apparel storefront.

## What it does

- accepts only authenticated server-to-server order requests
- rejects direct browser fulfilment requests
- validates customer/order fields
- ignores client-supplied product codes, prices and artwork URLs
- maps Outlaw Tee sizes to the approved Two Fifteen SKUs
- uses the approved public front/back artwork URLs
- signs the exact JSON body with `SHA1(request body + Two Fifteen Secret Key)`
- sends the signed request to `POST https://www.twofifteen.co.uk/api/orders.php`
- records order state in Cloudflare D1 to stop accidental duplicate fulfilment
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

## Required Cloudflare secrets

Never commit these to GitHub.

```bash
wrangler secret put TWOFIFTEEN_SECRET_KEY
wrangler secret put FULFILMENT_API_KEY
```

`TWOFIFTEEN_SECRET_KEY` is the Secret Key from Two Fifteen API Settings.

`FULFILMENT_API_KEY` is a separate random token used to protect this Worker. It must never be placed in the public Rage Bait JavaScript.

## D1 duplicate protection

Create a dedicated D1 database:

```bash
wrangler d1 create rage-bait-orders
```

Copy the returned `database_id` into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "rage-bait-orders"
database_id = "YOUR_D1_DATABASE_ID"
migrations_dir = "migrations"
```

Apply the migration:

```bash
wrangler d1 migrations apply rage-bait-orders --remote
```

The `/orders` route refuses live fulfilment if the D1 binding is missing.

## Safe first deployment

`ALLOW_LIVE_SUBMISSION` is deliberately `false` in `wrangler.toml`.

Deploy the Worker:

```bash
npm install
npm run deploy
```

Check health:

```bash
curl https://YOUR-WORKER.workers.dev/health
```

## Validate an order without sending it to Two Fifteen

```bash
curl -X POST https://YOUR-WORKER.workers.dev/validate \
  -H "Authorization: Bearer YOUR_FULFILMENT_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "RBA-TEST-001",
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
        "product": "outlaw-tee",
        "size": "XL",
        "quantity": 1
      }
    ]
  }'
```

The Worker returns the exact Two Fifteen payload but does not submit it.

## Enable live fulfilment

Only after validation and a controlled test, set:

```toml
ALLOW_LIVE_SUBMISSION = "true"
```

Then redeploy.

Live order endpoint:

```text
POST /orders
Authorization: Bearer <FULFILMENT_API_KEY>
Content-Type: application/json
```

The public GitHub Pages storefront must **not** call `/orders` directly. The correct production flow is:

```text
Customer checkout
      ↓
Payment provider confirms payment server-side
      ↓
Trusted payment/order backend calls this Worker
      ↓
Worker validates + signs order
      ↓
Two Fifteen
```

This prevents unpaid or forged browser requests from generating fulfilment orders.
