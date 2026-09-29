# Rage Bait Apparel — Join the Crew + Banter setup

This connects the website signup form, the **Best Trolling Banta** comment wall and the private moderation dashboard to Cloudflare Workers + D1. Crew signups continue to email the updated crew list after each new signup.

## 1. Create/update the D1 database

In Cloudflare Dashboard:

1. Go to **Storage & Databases → D1 SQL Database**.
2. Open `rage-bait-crew`.
3. Select **Console**.
4. Paste the current contents of `schema.sql` and select **Execute**.

If the database already exists, it is safe to run the current `schema.sql` again. The `CREATE TABLE IF NOT EXISTS` statements keep the existing `crew` data and add/retain the `banter_comments` table.

## 2. Update the Worker

1. Go to **Workers & Pages**.
2. Open `rage-bait-crew-signup`.
3. Open **Edit code**.
4. Replace the current code with the latest `join-the-crew-worker.js`.
5. Save/deploy it.

The existing signup endpoint at `/` is preserved.

## 3. Check the D1 binding

On the Worker under **Settings / Bindings** make sure this exists:

- D1 database variable name: `DB`
- Database: `rage-bait-crew`

## 4. Check the email binding

The existing Join the Crew email setup should keep:

- Send Email binding variable name: `EMAIL`
- Environment variable `NOTIFY_TO` pointing to the verified destination inbox

## 5. Add the moderator secret

On the `rage-bait-crew-signup` Worker add a **Secret** (not a normal public text variable):

- Name: `MODERATOR_KEY`
- Value: choose a long private password, at least 16 characters. A random 24–32+ character value is better.

Do not put the moderator key into GitHub or the website code. The moderation page asks you for it when you open the page and keeps it only in that browser tab using `sessionStorage`.

## 6. Deploy the Worker

The live site expects:

`https://rage-bait-crew-signup.brokensoulsandbackroads.workers.dev`

Public Banter endpoints:

- `GET /comments?sort=newest&limit=50` — load visible comments
- `POST /comments` — post a comment
- `POST /comments/:id/react` — add 👍, 😂 or 🔥

Protected moderation endpoints:

- `GET /admin/comments` — list all comments, including hidden ones
- `POST /admin/comments/:id/visibility` — hide or restore a comment
- `DELETE /admin/comments/:id` — permanently delete a comment

The protected endpoints require the `X-Rage-Bait-Admin` header to exactly match the Cloudflare `MODERATOR_KEY` secret.

## 7. Test Best Trolling Banta

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

## 8. Use the moderation dashboard

The moderation page is deliberately not linked in the public navigation:

`https://ragebaitapparel.co.uk/banter-admin.html`

Open it, enter the same value you configured as the Cloudflare `MODERATOR_KEY`, then use:

- **Hide** — immediately removes a comment from the public wall but retains it in D1
- **Unhide** — restores a hidden comment
- **Delete** — permanently removes the comment after a confirmation prompt
- **All / Visible / Hidden** filters
- Search by display name or comment text
- Reaction totals and comment IDs

Click **Lock admin** when finished. The key is stored only for the current browser tab/session.

## 9. Website connection

`banter.js` mounts the Banter section on the homepage, adds the Banter navigation link, posts comments to the Worker, loads shared comments, handles reactions and marks the highest reaction score as **Top Troll**.

`banter-admin.html` is the standalone moderation dashboard. It contains no moderator password. Authentication is enforced by the Worker using the Cloudflare secret.

`visitor-counter.js` loads `banter.js`, so no extra `<script>` tag is required in `index.html`.
