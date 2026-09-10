# Postgres migration — status & cutover guide

## Where things stand

Every function in `src/db/store.ts` now checks `db` (set when `DATABASE_URL`
is configured — see `src/db/client.ts`) and delegates to its Postgres
implementation in `src/db/store.pg.ts` when it's available, falling back to
the original JSON file logic (`.data/store.json`) otherwise. **Nothing about
this is automatic in production** — the app only switches over when you set
`DATABASE_URL`, so local development with no env var configured keeps
working exactly as before, unchanged.

This means the migration is no longer "half done" — every exported function
has both a JSON and a Postgres path, so setting `DATABASE_URL` switches the
*entire* data layer at once rather than splitting reads and writes across
two stores (the split-brain state `SCALING.md` explicitly warns against).

### What's in each file
- **`src/db/schema.ts`** — the full relational schema, extended with
  `products.stock`, `categories.banner_url`, `subcategories.banner_url`,
  `admins.reset_token_hash`/`reset_token_expires_at`, and a new
  `product_reviews` table — all needed to reach full parity with what the
  app actually uses today (these didn't exist in the original schema).
- **`src/db/client.ts`** — the Neon client. Uses `drizzle-orm/neon-serverless`
  (a WebSocket `Pool`, full Postgres wire protocol) rather than `neon-http`,
  because the checkout transaction needs a real interactive session
  (`SELECT ... FOR UPDATE`, inspect the result, conditionally roll back) —
  `neon-http` can only batch a fixed list of statements and can't do that.
- **`src/db/store.pg.ts`** — every function from `store.ts`, ported:
  catalog reads/writes, orders (admin + the atomic checkout transaction),
  admin auth + password reset, product reviews, hero slides.
- **`src/db/store.ts`** — the dispatcher every route already imports from;
  each function is `if (db) { ...pg version... } else { ...json version... }`.
- **`scripts/migrate-to-postgres.ts`** — one-time script that copies
  categories, products, variants, settings, historical orders, admin
  accounts, reviews, and hero slides out of `.data/store.json` into
  Postgres. Safe to re-run (upserts on primary key).

## Cutover checklist

1. Create a Postgres database (Neon free tier is fine) and copy its
   **pooled** connection string (the one with `-pooler` in the hostname).
2. Set `DATABASE_URL` in `.env.local`.
3. `npm run db:push` — creates every table from `src/db/schema.ts`.
4. `npm run migrate:pg` — copies your current `.data/store.json` data in.
5. Spot-check row counts in your Postgres dashboard against
   `.data/store.json` (category/product/order counts should match exactly).
6. Test the whole app locally with `DATABASE_URL` set: browse the storefront,
   place a test order, check it appears in `/admin/orders`, edit a product,
   log in as admin, submit a review. **This step matters** — none of the
   Postgres code in this repo has been run against a live database from the
   sandbox that wrote it (no network access there), so treat it as
   unverified until you've clicked through it yourself.
7. Once verified locally, set `DATABASE_URL` in production.

On Vercel, `DATABASE_URL` must be added under Project Settings -> Environment
Variables for Production (and Preview if you test preview deployments). The
JSON fallback is intentionally rejected on Vercel because its filesystem is
ephemeral and is not shared between serverless instances.

## Why the checkout path is the one piece built with extra care

`createOrderPg`'s `SELECT ... FOR UPDATE` + transaction is what makes two
simultaneous checkouts for the last unit of a limited item resolve
correctly even across multiple server instances — something the JSON file
store's single-process `decrementStock()` (see the comment on that function
in `src/db/store.ts`) cannot guarantee once more than one server process is
running. Every other function is a more mechanical translation, but this
one got the most scrutiny because it's the one place a bug costs real money
or oversells a limited item.

## Known gaps / things to verify yourself

- **`tx.execute(sql...)`'s result shape** in `createOrderPg` (the `.rows`
  access) is written to match `drizzle-orm`'s `neon-serverless` driver as
  documented at the time this was written — confirm it against your
  actually-installed versions with a `console.log` before trusting it.
- **`saveCategoryPg`** replaces a category's entire subcategory list based
  on what's submitted (deletes any subcategory row not present in the
  incoming list) — this matches the admin UI's "submit the full form"
  pattern, but double-check it against how your admin category form
  actually submits data.
- Customization steps/options (`customization_steps`/`customization_options`
  tables) are **not yet read or written** by `store.pg.ts` — customized-cake
  products will migrate their base product/variant data but not their
  customization step definitions. This wasn't part of the original request's
  emphasis (checkout math for customized cakes already works via the
  shared default option tables in `src/lib/customizationDefaults.ts`), but
  flagging it so it isn't a surprise.
