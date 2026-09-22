# Rage Bait Apparel — Join the Crew setup

This connects the website signup form to Cloudflare Workers + D1 and emails the updated crew list after each new signup.

## 1. Create the D1 database

In Cloudflare Dashboard:

1. Go to **Storage & Databases → D1 SQL Database**.
2. Select **Create database**.
3. Name it `rage-bait-crew`.
4. If offered a data jurisdiction/location, choose an appropriate European location/jurisdiction.
5. Open the new database and select **Console**.
6. Paste the contents of `schema.sql` and select **Execute**.

## 2. Create the Worker

1. Go to **Workers & Pages**.
2. Create a new Worker named `rage-bait-crew-signup`.
3. Open **Edit code**.
4. Replace the starter code with the contents of `join-the-crew-worker.js`.
5. Save/deploy it.

## 3. Bind the D1 database

On the Worker:

1. Open **Settings / Bindings**.
2. Add a **D1 database** binding.
3. Variable name: `DB`.
4. Database: `rage-bait-crew`.

## 4. Add the email binding

Cloudflare Email Routing must already be enabled and the real destination inbox must be verified.

On the Worker:

1. Add a **Send Email** binding.
2. Variable name: `EMAIL`.
3. Restrict it to the verified destination inbox if Cloudflare offers that option.

Cloudflare allows sends to verified destination addresses on the Free plan.

## 5. Add the destination address variable

On the Worker add a text environment variable:

- Name: `NOTIFY_TO`
- Value: the real verified inbox that currently receives mail forwarded from `crew@ragebaitapparel.co.uk`

Do not use `crew@ragebaitapparel.co.uk` here unless Cloudflare shows it as a verified destination. Use the actual verified Gmail/Outlook destination.

## 6. Deploy and copy the Worker URL

Deploy the Worker and copy its public URL, for example:

`https://rage-bait-crew-signup.<your-workers-subdomain>.workers.dev`

The website can then POST JSON like:

```json
{
  "email": "person@example.com",
  "website": ""
}
```

A successful new signup returns:

```json
{
  "ok": true,
  "status": "added",
  "count": 1,
  "message": "You're in. Welcome to the crew."
}
```

A duplicate returns `status: "duplicate"` and does not send another list email.

## 7. Website connection

Once the Worker URL is known, update `app.js` so the Join the Crew form posts to that URL instead of showing the current demo-only success message.
