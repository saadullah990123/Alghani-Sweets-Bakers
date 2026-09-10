// -----------------------------------------------------------------------------
// PAGINATION — Performance + Scalability Audit Finding 8-A
// -----------------------------------------------------------------------------
// Shared page/pageSize parsing + array pagination, used by the admin orders
// and reviews endpoints so both unbounded, ever-growing collections
// (src/db/store.ts's `orders` and `reviews`) return a bounded page instead
// of their entire history on every request.
//
// This intentionally does NOT get added to product/category endpoints —
// those are small, admin-curated catalogs, not user-generated collections
// that grow without bound (see the audit's §35 "what not to change").
// -----------------------------------------------------------------------------

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResult<T> {
  data: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Parses `page`/`pageSize` query params with safe defaults and bounds:
 * page always resolves to >= 1, pageSize is clamped between 1 and
 * MAX_PAGE_SIZE (so a client can't request an effectively-unbounded page
 * and defeat the point of paginating at all).
 */
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const rawPage = Number(searchParams.get('page'));
  const rawPageSize = Number(searchParams.get('pageSize'));

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawPageSize) && rawPageSize >= 1
      ? Math.min(Math.floor(rawPageSize), MAX_PAGE_SIZE)
      : DEFAULT_PAGE_SIZE;

  return { page, pageSize };
}

/**
 * Slices an already-filtered/sorted in-memory array into one page. Used by
 * the JSON store path (which necessarily has the full filtered array in
 * memory already) and by the Postgres path's reviews query (small enough
 * per-product not to need a dedicated COUNT query). The Postgres orders
 * path instead does real LIMIT/OFFSET + a COUNT query at the database level
 * — see getOrdersPg in src/db/store.pg.ts — since that collection is the
 * one most likely to actually grow large.
 *
 * If `page` is past the last page (e.g. a filter changed and there are
 * fewer results now), this clamps to the last valid page rather than
 * returning an empty page with a confusing "page 7 of 3" state.
 */
export function paginate<T>(items: T[], params: PaginationParams): PaginatedResult<T> {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / params.pageSize));
  const safePage = Math.min(params.page, totalPages);
  const start = (safePage - 1) * params.pageSize;
  const data = items.slice(start, start + params.pageSize);

  return { data, page: safePage, pageSize: params.pageSize, totalItems, totalPages };
}
