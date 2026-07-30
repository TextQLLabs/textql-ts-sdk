import type { ColumnFilter } from './tableFilter';
import type { SortEntry } from './tableSort';
import { isRecord } from './utils';

type Options<T> = {
  /** List endpoint, e.g. `/api/chats`. Facets are appended as query params. */
  endpoint: string;
  /** Key the rows live under in the response, e.g. `chats`. */
  rowsKey: string;
  parse: (item: Record<string, unknown>) => T | null;
  defaultSort?: SortEntry[];
};

/**
 * Server-paged, server-filtered list backing a FilterToolbar surface.
 *
 * Facets go out as query params — one entry per selected value, keyed by facet
 * id — and any change refetches from page 0 after a short debounce. Scrolling
 * appends the next page instead.
 */
export class PagedList<T extends { id: string }> {
  items = $state<T[]>([]);
  loading = $state(true);
  error = $state(false);

  page = $state(0);
  totalCount = $state(0);
  hasMore = $state(false);
  loadingMore = $state(false);
  moreError = $state(false);
  /** A facet-driven refetch is in flight — keeps the old rows visible. */
  searching = $state(false);

  search = $state('');
  filters = $state<ColumnFilter[]>([]);
  sortEntries = $state<SortEntry[]>([]);

  #options: Options<T>;
  #firstQuery = true;

  constructor(options: Options<T>) {
    this.#options = options;
    this.sortEntries = options.defaultSort ?? [];
  }

  /** Facet + search + sort state as the query string the route expects. */
  get queryString(): string {
    const params = new URLSearchParams();
    if (this.search.trim()) params.set('q', this.search.trim());
    // A date facet only ever holds one value, so appending is equivalent to
    // setting and no facet needs a special case here.
    for (const filter of this.filters) {
      for (const value of filter.values) params.append(filter.columnId, value);
    }
    const sort = this.sortEntries[0];
    if (sort) {
      params.set('sort', sort.columnId);
      params.set('dir', sort.dir);
    }
    return params.toString();
  }

  get narrowed(): boolean {
    return this.filters.length > 0 || this.search.trim().length > 0;
  }

  clearFilters() {
    this.filters = [];
    this.search = '';
  }

  async #fetchPage(index: number) {
    const query = this.queryString;
    const response = await fetch(
      `${this.#options.endpoint}?page=${index}${query ? `&${query}` : ''}`
    );
    const payload: unknown = await response.json();
    const rows = isRecord(payload) ? payload[this.#options.rowsKey] : undefined;

    if (!response.ok || !isRecord(payload) || !Array.isArray(rows)) {
      throw new Error('Unable to load list.');
    }

    return {
      items: rows
        .filter((item): item is Record<string, unknown> => isRecord(item))
        .map(this.#options.parse)
        .filter((item): item is T => item !== null),
      totalCount: typeof payload.totalCount === 'number' ? payload.totalCount : 0,
      hasMore: payload.hasMore === true
    };
  }

  load = async () => {
    // A facet refetch keeps the current rows under the toolbar spinner —
    // blanking the list on every keystroke reads as a page reload.
    this.loading = !this.searching;
    this.error = false;
    this.moreError = false;

    try {
      const first = await this.#fetchPage(0);
      this.items = first.items;
      this.totalCount = first.totalCount;
      this.hasMore = first.hasMore;
      this.page = 0;
    } catch {
      this.error = true;
    } finally {
      this.loading = false;
      this.searching = false;
    }
  };

  loadMore = async () => {
    if (this.loadingMore || !this.hasMore || this.loading) return;
    this.loadingMore = true;
    this.moreError = false;

    const next = this.page + 1;
    try {
      const result = await this.#fetchPage(next);
      // Offset paging can repeat a row if one is updated mid-scroll.
      const seen = new Set(this.items.map((item) => item.id));
      this.items = [...this.items, ...result.items.filter((item) => !seen.has(item.id))];
      this.totalCount = result.totalCount;
      this.hasMore = result.hasMore;
      this.page = next;
    } catch {
      this.moreError = true;
    } finally {
      this.loadingMore = false;
    }
  };

  /** Drop a row optimistically; returns a rollback for the failure path. */
  remove(id: string): () => void {
    const previousItems = this.items;
    const previousTotal = this.totalCount;
    this.items = this.items.filter((item) => item.id !== id);
    this.totalCount = Math.max(0, this.totalCount - 1);
    return () => {
      this.items = previousItems;
      this.totalCount = previousTotal;
    };
  }

  /**
   * Call inside an `$effect`. Refetches from page 0 when the facets change,
   * debounced because `search` updates on every keystroke.
   */
  watchQuery(): (() => void) | undefined {
    // Read first so the effect tracks the facets, not just the timer.
    void this.queryString;
    if (this.#firstQuery) {
      this.#firstQuery = false;
      return;
    }
    this.searching = true;
    const timer = setTimeout(() => void this.load(), 250);
    return () => clearTimeout(timer);
  }

  /**
   * Call inside an `$effect` with the sentinel node. Auto-advances when it
   * scrolls into view; the caller's button stays as the keyboard-reachable and
   * post-error path.
   */
  watchSentinel(node: HTMLElement | undefined): (() => void) | undefined {
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !this.moreError) {
          void this.loadMore();
        }
      },
      { rootMargin: '320px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }
}

/** Load `{ members: [...] }` from a facet endpoint into FilterOption shape. */
export async function loadMemberOptions(endpoint: string) {
  try {
    const response = await fetch(endpoint);
    const payload: unknown = await response.json();
    if (!response.ok || !isRecord(payload) || !Array.isArray(payload.members)) return [];

    return payload.members
      .filter(
        (item): item is Record<string, unknown> => isRecord(item) && typeof item.id === 'string'
      )
      .map((item) => ({
        value: item.id as string,
        label:
          (typeof item.name === 'string' && item.name) ||
          (typeof item.email === 'string' && item.email) ||
          (item.id as string),
        imageUrl: typeof item.pictureUrl === 'string' ? item.pictureUrl : null
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  } catch {
    // A missing creator facet is better than a broken page.
    return [];
  }
}
