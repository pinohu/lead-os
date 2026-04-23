// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PaginationParams {
  cursor?: string;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  /** ID of the last item in this page, used as the `cursor` value for the next request. Null when there are no more pages. */
  cursor: string | null;
  hasMore: boolean;
  total: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extracts and normalises `cursor` and `limit` from URL search parameters.
 *
 * `limit` is clamped to [1, 100] and defaults to 20 when absent or
 * unparseable. This mirrors the same range enforced by `paginate`.
 *
 * @param url - The parsed request URL.
 */
export function parsePaginationParams(url: URL): PaginationParams {
  const cursor = url.searchParams.get("cursor") ?? undefined;
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit
    ? Math.min(Math.max(1, parseInt(rawLimit, 10) || 20), 100)
    : 20;
  return { cursor, limit };
}

/**
 * Applies cursor-based pagination to an in-memory array.
 *
 * The cursor is the ID of the last item returned in the previous page. Pass a
 * custom `getId` extractor when items do not carry a top-level `id` string.
 *
 * @param items - The full, pre-filtered, pre-sorted collection.
 * @param params - Pagination parameters (cursor + limit).
 * @param getId - Extracts the string ID from an item. Defaults to `item.id`.
 */
export function paginate<T extends { id?: string }>(
  items: T[],
  params: PaginationParams,
  getId: (item: T) => string = (item) => (item as { id: string }).id,
): PaginatedResult<T> {
  const limit = Math.min(Math.max(1, params.limit ?? 20), 100);
  let startIndex = 0;

  if (params.cursor) {
    const cursorIndex = items.findIndex((item) => getId(item) === params.cursor);
    startIndex = cursorIndex === -1 ? 0 : cursorIndex + 1;
  }

  const slice = items.slice(startIndex, startIndex + limit);
  const hasMore = startIndex + limit < items.length;
  const lastItem = slice[slice.length - 1];

  return {
    items: slice,
    cursor: hasMore && lastItem ? getId(lastItem) : null,
    hasMore,
    total: items.length,
  };
}
