# Scaling & Maintenance Guide

Practical guidance for keeping this site healthy and easy to extend over the
next 2-3 years — written for whoever picks this up next, human or AI. Read
this before starting a non-trivial change; it's shorter than re-discovering
the same lessons by trial and error.

---

## 1. How to add a new product

Products live in `src/db/seed-data.ts` (initial/seed data) and are edited
live via `/admin/products` (persisted to `.data/store.json`). To add a
product by hand:

1. Pick a `categoryId` and `subcategoryId` from the `initialCategories`
   array at the top of `seed-data.ts` — **do not invent a new one inline**;
   add it to `initialCategories` first if it doesn't exist yet.
2. Copy an existing product object of the same shape (`FIXED` for a single
   price, `VARIANT` for weight/size options, and use `packInfo` for
   retail-packaged items sold as a sealed pack rather than by weight).
3. Give it a unique, descriptive `id` (kebab-case, prefixed by category,
   e.g. `bis-tai-khara`) and `slug`.
4. Run `npx tsc --noEmit` — a wrong `pricingType` string or missing field
   will fail here before it ever reaches a customer.

Prefer doing this through `/admin/products` in a running app once the site
is live — it validates the shape for you and updates `.data/store.json`
without a deploy.

## 2. How to add a new category / dedicated landing page

See `AGENTS.md` → "Dedicated Category Landing Pages" for the exact steps.
The short version: add the category to `seed-data.ts`, copy one of the four
existing `src/app/<route>/page.tsx` files, and register it in
`DEDICATED_CATEGORY_ROUTES` inside `TwoTierCategoryNav.tsx`. You do **not**
need a new category to always get its own route — smaller categories are
fine living on the homepage's filterable grid via `StorefrontView.tsx`.

## 3. Known past bugs (so they don't come back)

These actually happened in this codebase and are worth knowing about before
touching related code:

- **Category leakage via `isPopular`/`isFeatured`.** An earlier version of
  the storefront filter pulled in *any* product flagged `isPopular` or
  `isFeatured` regardless of its real `categoryId`, so e.g. a popular sweet
  could show up under "Fast Food." Fixed by filtering strictly on
  `categoryId`/`subcategoryId` everywhere (`StorefrontView.tsx`, and every
  `/app/<category>/page.tsx`). **Never re-introduce a flag-based fallback
  filter** — if a section looks empty, that's a data problem to fix by
  adding/reassigning products, not a filter to loosen.
- **No auth on admin API routes.** Every `/api/admin/*` route now goes
  through `middleware.ts`, which verifies the session cookie before the
  route handler runs. If you add a new `/api/admin/*` route, it is
  automatically covered — but double check `PUBLIC_ADMIN_API` in
  `middleware.ts` doesn't accidentally include it.
- **Client-submitted prices.** `POST /api/orders` recomputes every price,
  the tax, delivery fee, and grand total from the live product catalog and
  store settings — it never trusts a number sent from the browser. Keep it
  that way for any new pricing logic (e.g. a future coupon/loyalty system).
- **Silent admin fetch failures.** Admin list pages used to only
  `console.error()` on a failed fetch, leaving the admin staring at an
  empty page with no explanation. Every admin data page should use
  `src/components/admin/AdminErrorBanner.tsx` on failure, with a working
  retry button — see any file under `src/app/admin/*/page.tsx` for the
  pattern (`loadError` state + `<AdminErrorBanner message={...}
  onRetry={...} />`).

## 4. Migrating off the JSON file store

`.data/store.json` is fine for a single-instance deployment with light
concurrent admin usage. You'll want to migrate once any of these are true:

- You deploy to a platform with an ephemeral/read-only filesystem (most
  serverless platforms, including Vercel's default runtime) — the file
  won't persist between deploys or may not be writable at all.
- You run more than one server instance (no shared state between them).
- Two admins editing at once start clobbering each other's changes
  (last-write-wins, no locking).

**Update:** every function in `src/db/store.ts` now has a working Postgres
implementation (`src/db/store.pg.ts`), selected automatically when
`DATABASE_URL` is set (see `src/db/client.ts`) — falling back to the JSON
file otherwise. The checkout path (`createOrderPg`) uses a real database
transaction with `SELECT ... FOR UPDATE` row locking so stock decrements
stay correct under concurrent checkouts across multiple server instances.
See `docs/postgres-migration.md` for the full cutover checklist
(provisioning, `npm run db:push`, `npm run migrate:pg`, and — importantly —
testing it against a live database before flipping `DATABASE_URL` in
production, since none of this Postgres code has been run against a real
database yet).

Do this migration in one focused session, not incrementally — a half
JSON/half-Postgres data layer is worse than either alone. That's exactly
why `store.ts` dispatches per-function rather than only reading from
Postgres for some things — setting `DATABASE_URL` switches everything at
once.

## 5. Testing strategy

**Update:** a Vitest suite now exists (`npm test`) covering the pieces
listed below, extracted into pure, dependency-free modules so they can be
tested without a server or database: `src/lib/pricing.ts` (checkout
math), `src/lib/stock.ts` (atomic stock decrement / race-condition
prevention), `src/lib/tokens.ts` (password-reset token expiry), and a
category-leakage regression test in `src/lib/__tests__/filterByCategory.test.ts`
that runs against the real seed data. Extend this suite as new pricing or
checkout logic is added — the original gap this section described (real
money, no tests) is closed for the pieces above.

Still untested: React component behavior (no `jsdom`/Testing Library set
up yet), and the Postgres store functions in `store.pg.ts` themselves
(they can only really be verified against a live database — see
`docs/postgres-migration.md`'s cutover checklist).

Still worth adding:
4. End-to-end smoke test (Playwright) for the full guest checkout flow.

## 6. Monitoring & finding problems in production

Nothing here currently reports errors anywhere except the server console
(`console.error(...)` calls throughout the admin routes, `notifications.ts`,
and `error.tsx`/`global-error.tsx`). Before this site handles real customer
traffic, wire up an error-tracking service (Sentry is the standard choice
for Next.js) and point these `console.error` calls at it — grep for
`console.error` to find every spot that should also report upstream.

`error.tsx` and `global-error.tsx` already catch and log unhandled
exceptions with a `digest` you can correlate against server logs — keep
that pattern for any new top-level route segment that needs its own error
boundary.

## 7. Theming / design system

See `AGENTS.md` → "Theming." The short version for anyone doing visual
work: change `tailwind.config.ts`'s `brand`/`gold` palettes, never hardcode
a new hex color inline unless you're also adding it to the palette. This is
what keeps a 2-3 year old site from accumulating a dozen slightly different
shades of "brand red" that nobody can safely consolidate later.

## 8. Before you consider any change "done"

1. `npx tsc --noEmit` — must be clean.
2. `npm run build` — must succeed; this also runs Next's own type/lint
   pass and catches issues `tsc` alone won't (e.g. invalid route exports).
3. Update `AGENTS.md` if you changed categories, routes, colors, or the
   data model — see the note at the top of that file.
