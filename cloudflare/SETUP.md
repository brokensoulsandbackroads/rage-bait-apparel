# Rage Bait Apparel — Join the Crew + Banter setup

This connects the website signup form and the **Best Trolling Banta** comment wall to Cloudflare Workers + D1. Crew signups continue to email the updated crew list after each new signup.

## 1. Create the D1 database

In Cloudflare Dashboard:

1. Go to **Storage & Databases → D1 SQL Database**.
2. Select **Create database**.
3. Name it `rage-bait-crew`.
4. If offered a data jurisdiction/location, choose an appropriate European location/jurisdiction.
5. Open the new database and select **Console**.
6. Paste the contents of `schema.sql` and select **Execute**.

If the database already exists, it is safe to run the current `schema.sql` again. The `CREATE TABLE IF NOT EXISTS` statements will keep the existing `crew` data and add the `banter_comments` table.

## 2. Create the Worker

1. Go to **Workers & Pages**.
2. Create a new Worker named `rage-bait-crew-signup`.
3. Open **Edit code**.
4. Replace the starter code with the contents of `join-the-crew-worker.js`.
5. Save/deploy it.

If the Worker already exists, replace its current code with the latest `join-the-crew-worker.js` and deploy it. The existing signup endpoint at `/` is preserved.

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

Deploy the Worker. The live site currently expects:

`https://rage-bait-crew-signup.brokensoulsandbackroads.workers.dev`

The signup form POSTs to `/`.

The Banter section uses:

- `GET /comments?sort=newest&limit=50` — load comments
- `POST /comments` — post a comment
- `POST /comments/:id/react` — add 👍, 😂 or 🔥

## 7. Test Join the Crew

The website can POST JSON like:

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

## 8. Test Best Trolling Banta

After running `schema.sql` and deploying the latest Worker, open:

`https://rage-bait-crew-signup.brokensoulsandbackroads.workers.dev/comments`

It should return JSON containing:

```json
{
  "ok": true,
  "comments": [],
  "topTrollId": null
}
```

A comment POST looks like:

```json
{
  "name": "ProfessionalInstigator",
  "message": "I came for a T-shirt and stayed to lower the tone.",
  "website": ""
}
```

The Worker blocks links, strips control characters, caps display names at 32 characters, caps comments at 500 characters, includes a honeypot field, and rejects identical repeat posts from the same display name within two minutes.

## 9. Moderating a comment

Comments have a `hidden` flag. To remove a public comment without deleting it, open the D1 Console and run:

```sql
UPDATE banter_comments
SET hidden = 1
WHERE id = 123;
```

Replace `123` with the comment ID. Hidden comments stop appearing on the website immediately.

To restore it:

```sql
UPDATE banter_comments
SET hidden = 0
WHERE id = 123;
```

## 10. Website connection

`banter.js` mounts the Banter section on the homepage, adds the Banter navigation link, posts comments to the Worker, loads shared comments, handles reactions and marks the highest reaction score as **Top Troll**.

`visitor-counter.js` loads `banter.js`, so no extra `<script>` tag is required in `index.html`.
