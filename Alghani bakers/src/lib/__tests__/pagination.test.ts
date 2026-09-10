import { describe, it, expect } from 'vitest';
import { parsePaginationParams, paginate, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../pagination';

describe('parsePaginationParams', () => {
  it('defaults to page 1 and DEFAULT_PAGE_SIZE when nothing is provided', () => {
    const params = parsePaginationParams(new URLSearchParams());
    expect(params).toEqual({ page: 1, pageSize: DEFAULT_PAGE_SIZE });
  });

  it('parses valid page and pageSize values', () => {
    const params = parsePaginationParams(new URLSearchParams('page=3&pageSize=20'));
    expect(params).toEqual({ page: 3, pageSize: 20 });
  });

  it('clamps pageSize to MAX_PAGE_SIZE so a client cannot request an effectively unbounded page', () => {
    const params = parsePaginationParams(new URLSearchParams('pageSize=999999'));
    expect(params.pageSize).toBe(MAX_PAGE_SIZE);
  });

  it('falls back to page 1 for invalid/negative/zero page values', () => {
    expect(parsePaginationParams(new URLSearchParams('page=0')).page).toBe(1);
    expect(parsePaginationParams(new URLSearchParams('page=-5')).page).toBe(1);
    expect(parsePaginationParams(new URLSearchParams('page=abc')).page).toBe(1);
  });

  it('falls back to DEFAULT_PAGE_SIZE for invalid/negative/zero pageSize values', () => {
    expect(parsePaginationParams(new URLSearchParams('pageSize=0')).pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePaginationParams(new URLSearchParams('pageSize=-10')).pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(parsePaginationParams(new URLSearchParams('pageSize=abc')).pageSize).toBe(DEFAULT_PAGE_SIZE);
  });

  it('floors non-integer values', () => {
    expect(parsePaginationParams(new URLSearchParams('page=2.9')).page).toBe(2);
  });
});

describe('paginate', () => {
  const items = Array.from({ length: 95 }, (_, i) => i + 1); // [1..95]

  it('returns the first page by default', () => {
    const result = paginate(items, { page: 1, pageSize: 50 });
    expect(result.data).toEqual(items.slice(0, 50));
    expect(result.totalItems).toBe(95);
    expect(result.totalPages).toBe(2);
    expect(result.page).toBe(1);
  });

  it('returns the correct slice for a later page', () => {
    const result = paginate(items, { page: 2, pageSize: 50 });
    expect(result.data).toEqual(items.slice(50, 95));
    expect(result.data.length).toBe(45);
  });

  it('clamps to the last valid page when the requested page is out of range', () => {
    const result = paginate(items, { page: 99, pageSize: 50 });
    expect(result.page).toBe(2); // last valid page for 95 items / 50 per page
    expect(result.data).toEqual(items.slice(50, 95));
  });

  it('returns one empty-but-valid page for an empty collection, never a division-by-zero page count', () => {
    const result = paginate([], { page: 1, pageSize: 50 });
    expect(result.data).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(1);
    expect(result.page).toBe(1);
  });

  it('handles a pageSize larger than the whole collection as a single page', () => {
    const result = paginate(items, { page: 1, pageSize: 200 });
    expect(result.data).toEqual(items);
    expect(result.totalPages).toBe(1);
  });
});
