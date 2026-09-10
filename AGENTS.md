# Al-Ghani Sweets & Bakers — Agent Context File

> This file is auto-loaded by AI coding assistants (Antigravity, Claude, etc.) to understand the full project context before making changes. Keep it updated as the project evolves — an out-of-date context file is worse than none, because it actively misleads the next change. **Update this file in the same session as any change to categories, routes, colors, or the data model.**

---

## Project Overview

**Al-Ghani Sweets & Bakers** is a full-stack Pakistani bakery e-commerce storefront built with **Next.js 14 App Router**. It uses a file-based JSON database (no external DB), has a full admin dashboard, and serves as a complete online ordering platform for sweets, cakes, biscuits, gift hampers, fast food, and customized occasion cakes.

- **Dev URL**: `http://localhost:3000`
- **Admin Panel**: `http://localhost:3000/admin` — Login: `admin@alghanisweets.com` / `admin12345`
- **WhatsApp**: `+923001234567`
- **Business**: Main Boulevard, Allama Iqbal Town / Gulberg, Lahore, Pakistan

For longer-term maintenance guidance (how to add features safely, where bugs tend to hide, and a rough scaling roadmap), see **`SCALING.md`** in the project root — read that file before starting any non-trivial change.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14.2 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 + custom tokens (light mode only — see "Theming") |
| Fonts | Outfit (sans), Playfair Display (serif), Caveat (handwriting) |
| Icons | Lucide React |
| Database | File-based JSON — `.data/store.json` (see `SCALING.md` for the Postgres migration path) |
| Email | Nodemailer (SMTP), optional — see `src/lib/notifications.ts` |
| State | React Context (CartContext, LocationContext) |
| Auth | Custom cookie session (bcryptjs) + token-based password reset |

---

## CRITICAL: File-Based Database

There is **NO external database**. All data lives in:

```
.data/store.json
```

- Auto-created from `src/db/seed-data.ts` on first API request
- To reset: delete `store.json` — server re-seeds on next request
- `.data/` is in `.gitignore`
- Every read goes through `src/db/store.ts` — **never** read/write `.data/store.json` directly from a route; always add a function to `store.ts` so there is one place that understands the file's shape and can be swapped for a real DB later.
- `ensureDataFile()` in `store.ts` includes a small migration shim (e.g. `if (!Array.isArray(parsed.reviews)) parsed.reviews = []`). **Every time you add a new top-level key to `StoreData`, add a matching migration line here** — otherwise anyone with an older `store.json` on disk will crash instead of upgrading gracefully.

---

## Theming (Light Mode Only — No Dark Mode)

This site is **intentionally single-theme**. Do not add a `dark:` Tailwind variant, a `prefers-color-scheme: dark` media query, or a `.dark` class toggle anywhere.

Single source of truth for color is `tailwind.config.ts`:

- **`brand-*`** — the primary red palette (`brand-500` = `#D32F2F`). Used for the nav bar, primary buttons, links, and focus rings **everywhere** (storefront + admin). To re-theme the whole site's primary color, change only this palette.
- **`gold-*`** — the accent yellow/gold palette (`gold-400` = `#FFC107`). Used sparingly: selected-category highlights, small badges. Never as a full-page background.
- **`brand-dark`** (`#3e200c`) — a neutral dark-brown "ink" color used for some headings/backgrounds where a warm dark accent (not literally red) reads better. This is a deliberate design choice, not dark mode.
- A few older components still use literal hex (`#c8102e`, `#ffd200`) instead of the `brand-*`/`gold-*` tokens (mostly `TwoTierCategoryNav.tsx`, `Header.tsx`, `SearchBar.tsx`, `StorefrontView.tsx`). These are visually aligned with the token palette today, but **new code should always use the Tailwind tokens**, not literal hex, so a future re-theme only requires editing `tailwind.config.ts`. Migrating the remaining literal-hex spots to tokens is tracked in `SCALING.md`.
- Product cards: white rounded card (`bg-white rounded-2xl shadow-sm`), light gray image backdrop (`bg-gray-50`), red price (`text-brand-600`), red "+ ADD" button (`bg-red-600`). See `src/components/product/ProductCard.tsx` — this is the canonical pattern for any new product-like card.

---

## Dedicated Category Landing Pages

Four categories have their own route with sequential sub-banner sections (banner image + heading + product grid, repeated per subcategory group), instead of being filtered in-place on the homepage:

| Route | categoryId | Sections |
|---|---|---|
| `/cakes` | `cakes` | Classic Cakes, Dry Cakes, Dream Cakes |
| `/fast-food` | `fast-food` | Salads & Sandwiches, Burgers, Pizza, Fast Food / Broast |
| `/biscuits-cookies` | `biscuits` | Biscuits, Packed Biscuits & Cookies |
| `/gift-essentials` | `deals-treasure` | Gift Hampers, Premium Sweet Boxes, Family Combos & Hi-Tea Platters |

Shared rendering component: `src/components/category/CategoryLandingView.tsx`. Each page (`src/app/<route>/page.tsx`) is a server component that:
1. Fetches `getCategories()` + `getProducts()`.
2. **Strictly filters by `categoryId`** (never by `isPopular`/`isFeatured` — that caused cross-category leakage bugs in the past, see `SCALING.md` → "Known past bugs").
3. Groups the filtered products by `subcategoryId` into the section list above.

**To add a 5th dedicated category page**, copy one of these four files, adjust the `categoryId` filter and section list, then add it to `DEDICATED_CATEGORY_ROUTES` in `src/components/layout/TwoTierCategoryNav.tsx` so the nav routes to the new page instead of filtering the homepage in place.

All other categories (Sweets, Customized Cakes, Desserts, Frozen) still use the homepage's single filterable grid via `StorefrontView.tsx` + `TwoTierCategoryNav.tsx`.

---

## Environment Variables (.env.local)

See `.env.example` for the full, documented list, including the optional new-order-alert SMTP/webhook variables. Key ones:

```env
DATABASE_URL=                    # Empty — using file-based store (no external DB)
ADMIN_SESSION_SECRET=local_dev_alghani_super_secret_session_key_32bytes_long
ADMIN_INITIAL_EMAIL=admin@alghanisweets.com
ADMIN_INITIAL_PASSWORD=admin12345
NEXT_PUBLIC_APP_URL=http://localhost:3000
SMTP_HOST= / SMTP_USER= / SMTP_PASS= / ALERT_EMAIL_TO=   # optional — order alert emails
ORDER_ALERT_WEBHOOK_URL=                                  # optional — WhatsApp/Zapier/etc. webhook
```

---

## Project Structure (key files)

```
src/db/seed-data.ts                         <- Source of truth for all initial/seed data
src/db/store.ts                             <- ONLY place allowed to touch .data/store.json
src/lib/types.ts                            <- All TypeScript interfaces (the data contract)
src/lib/notifications.ts                    <- New-order email + webhook alerts
src/components/home/StorefrontView.tsx      <- Homepage: dynamic banner + filterable products grid
src/components/category/CategoryLandingView.tsx <- Shared shell for the 4 dedicated category pages
src/components/layout/TwoTierCategoryNav.tsx<- Category nav; routes vs. in-place filter decided here
src/components/admin/AdminErrorBanner.tsx   <- Reusable visible-failure banner for admin pages
src/app/globals.css                         <- Brand tokens & Tailwind base (light mode only)
tailwind.config.ts                          <- Colors ("brand"/"gold"), animations, shadows
src/app/admin/categories/page.tsx           <- Admin: category + subcategory + bannerUrl manager
SCALING.md                                  <- Longer-term maintenance & extension guide (read first)
```

---

## Commands

```bash
npm run dev                   # Start dev server
npx tsc --noEmit              # Type-check only — run this after every change
npm run build                 # Production build — run this before considering any task "done"
# Reset database:
rm -f .data/store.json        # (Windows PowerShell: Remove-Item ".data/store.json" -Force)
```

---

## Things Left To Do

- [x] ~~Migrate the remaining literal-hex color usages (`#c8102e`, `#ffd200`) to the `brand-*`/`gold-*` Tailwind tokens~~ — done.
- [x] ~~Add automated tests~~ — a Vitest suite exists now (`npm test`); see `SCALING.md` → "Testing strategy" for what's covered and what still isn't (component tests, live-DB tests).
- [x] ~~Fill in the `[PLACEHOLDER]` legal business name/address/jurisdiction~~ — done in `/legal/privacy-policy` and `/legal/terms-of-service`.
- [x] ~~Add a graceful fallback for missing product photos~~ — `src/components/product/ProductImage.tsx` now falls back to the category/subcategory banner on any missing or broken image, site-wide.
- [x] ~~Move admin image uploads off the local filesystem~~ — `POST /api/admin/upload` now uploads to Vercel Blob (`@vercel/blob`) instead of `public/images/uploads/`, from either a file picked on the admin's PC or a pasted external image URL. Requires `BLOB_READ_WRITE_TOKEN` (see `.env.example`) — without it the endpoint returns a clear 500 rather than silently writing to a filesystem that won't persist on Vercel. This was Finding 13-A (P0) in the Performance + Scalability Audit.
- [x] ~~Add rate limiting to sensitive routes~~ — `src/lib/rateLimit.ts` (in-memory, per-process fixed-window limiter — intentionally not Redis-backed; see that file's comment for when to revisit) is wired into `POST /api/admin/login` (5/15min), `POST /api/admin/forgot-password` (3/hour), `POST /api/orders` (10/15min), and `POST /api/reviews` (5/hour), all per client IP. This was Finding 10-A.
- [x] ~~Add timeouts to outbound notification calls~~ — `src/lib/notifications.ts`'s webhook `fetch()` now has `AbortSignal.timeout(10000)`, and its `nodemailer` transport has `connectionTimeout`/`socketTimeout` set to 10000ms. This was Finding 21-A.
- [x] ~~Paginate the admin orders/reviews lists~~ — `GET /api/admin/orders` and `GET /api/admin/reviews` now accept `?page=&pageSize=` (`src/lib/pagination.ts`) and return `{data, page, pageSize, totalItems, totalPages}` instead of the entire collection. The Postgres path does real `LIMIT`/`OFFSET` + `COUNT` at the database level; the JSON path paginates the already-filtered in-memory array. Both admin UI pages (`/admin/orders`, `/admin/reviews`) were updated to fetch page-by-page with debounced search instead of fetching everything upfront. This was Finding 8-A. Deliberately NOT applied to products/categories — see `SCALING.md`'s "what not to change".
- [x] ~~Cache the JSON store so every read doesn't re-parse the whole file~~ — `src/db/store.ts`'s `ensureDataFile()`/`saveData()` now keep an in-memory (L1) copy of `StoreData`, read from disk once per process and kept in sync on every write. This was Finding 4-A / 15-A — see the comment above `ensureDataFile()` for the invariant that makes this safe (every mutation reads, mutates, and saves in one synchronous breath, never leaving the cache observably stale).
- [x] ~~Batch product lookups at checkout~~ — `POST /api/orders` now fetches every distinct product a cart references in one `getProductsByIds()` call (`WHERE id IN (...)` in Postgres mode) instead of looping and calling `getProductById()` once per line item. This was Finding 3-A.
- [x] ~~Bound the Postgres connection pool~~ — `src/db/client.ts`'s `Pool` now sets explicit `max: 10`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 2000` instead of relying on driver defaults. This was Finding 17-A.
- [ ] Postgres migration is code-complete (`src/db/store.pg.ts`, dispatched automatically via `src/db/store.ts` when `DATABASE_URL` is set) but **not yet verified against a live database** — see `docs/postgres-migration.md` for the cutover checklist before setting `DATABASE_URL` in production.
- [ ] Production deployment (Vercel recommended) — do this after finishing the Postgres cutover checklist above, not before, to avoid write-contention on `.data/store.json` under real traffic.
- [ ] End-to-end smoke test (Playwright) for the full guest checkout flow — see `SCALING.md` → "Testing strategy".
