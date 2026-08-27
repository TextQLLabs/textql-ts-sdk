import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type { ColumnFilter } from './tableFilter';
import type { SortEntry } from './tableSort';
import { isRecord } from './utils';

type Options<T> = {
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
export function usePagedList<T extends { id: string }>({
	endpoint,
	rowsKey,
	parse,
	defaultSort = []
}: Options<T>) {
	const [items, setItems] = useState<T[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	const [page, setPage] = useState(0);
	const [totalCount, setTotalCount] = useState(0);
	const [hasMore, setHasMore] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [moreError, setMoreError] = useState(false);
	/** A facet-driven refetch is in flight — keeps the old rows visible. */
	const [searching, setSearching] = useState(false);

	const [search, setSearch] = useState('');
	const [filters, setFilters] = useState<ColumnFilter[]>([]);
	const [sortEntries, setSortEntries] = useState<SortEntry[]>(defaultSort);

	const sentinelRef = useRef<HTMLDivElement | null>(null);

	/** Facet + search + sort state as the query string the route expects. */
	const queryString = useMemo(() => {
		const params = new URLSearchParams();
		if (search.trim()) params.set('q', search.trim());
		// A date facet only ever holds one value, so appending is equivalent to
		// setting and no facet needs a special case here.
		for (const filter of filters) {
			for (const value of filter.values) params.append(filter.columnId, value);
		}
		const sort = sortEntries[0];
		if (sort) {
			params.set('sort', sort.columnId);
			params.set('dir', sort.dir);
		}
		return params.toString();
	}, [search, filters, sortEntries]);

	// Read inside callbacks without making them depend on every keystroke.
	const queryRef = useRef(queryString);
	queryRef.current = queryString;
	const parseRef = useRef(parse);
	parseRef.current = parse;

	const fetchPage = useCallback(
		async (index: number) => {
			const query = queryRef.current;
			const response = await fetch(`${endpoint}?page=${index}${query ? `&${query}` : ''}`);
			const payload: unknown = await response.json();
			const rows = isRecord(payload) ? payload[rowsKey] : undefined;

			if (!response.ok || !isRecord(payload) || !Array.isArray(rows)) {
				throw new Error('Unable to load list.');
			}

			return {
				items: rows
					.filter((item): item is Record<string, unknown> => isRecord(item))
					.map((item) => parseRef.current(item))
					.filter((item): item is T => item !== null),
				totalCount: typeof payload.totalCount === 'number' ? payload.totalCount : 0,
				hasMore: payload.hasMore === true
			};
		},
		[endpoint, rowsKey]
	);

	const load = useCallback(
		async (isRefetch = false) => {
			// A facet refetch keeps the current rows under the toolbar spinner —
			// blanking the list on every keystroke reads as a page reload.
			setLoading(!isRefetch);
			setError(false);
			setMoreError(false);

			try {
				const first = await fetchPage(0);
				setItems(first.items);
				setTotalCount(first.totalCount);
				setHasMore(first.hasMore);
				setPage(0);
			} catch {
				setError(true);
			} finally {
				setLoading(false);
				setSearching(false);
			}
		},
		[fetchPage]
	);

	const loadMore = useCallback(async () => {
		if (loadingMore || !hasMore || loading) return;
		setLoadingMore(true);
		setMoreError(false);

		const next = page + 1;
		try {
			const result = await fetchPage(next);
			// Offset paging can repeat a row if one is updated mid-scroll.
			setItems((current) => {
				const seen = new Set(current.map((item) => item.id));
				return [...current, ...result.items.filter((item) => !seen.has(item.id))];
			});
			setTotalCount(result.totalCount);
			setHasMore(result.hasMore);
			setPage(next);
		} catch {
			setMoreError(true);
		} finally {
			setLoadingMore(false);
		}
	}, [fetchPage, hasMore, loading, loadingMore, page]);

	useEffect(() => {
		void load();
		// Mount only — facet changes are handled by the debounced effect below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Refetch from page 0 whenever the facets change. Debounced because `search`
	// updates on every keystroke.
	const firstQuery = useRef(true);
	useEffect(() => {
		if (firstQuery.current) {
			firstQuery.current = false;
			return;
		}
		setSearching(true);
		const timer = setTimeout(() => void load(true), 250);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queryString]);

	// Auto-advance when the sentinel scrolls into view; the caller's button stays
	// as the keyboard-reachable and post-error path.
	useEffect(() => {
		const target = sentinelRef.current;
		if (!target || !hasMore || moreError) return;

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) void loadMore();
			},
			{ rootMargin: '320px' }
		);
		observer.observe(target);
		return () => observer.disconnect();
	}, [hasMore, moreError, loadMore]);

	/** Drop a row optimistically; returns a rollback for the failure path. */
	const remove = useCallback(
		(id: string) => {
			const previousItems = items;
			const previousTotal = totalCount;
			setItems(items.filter((item) => item.id !== id));
			setTotalCount(Math.max(0, totalCount - 1));
			return () => {
				setItems(previousItems);
				setTotalCount(previousTotal);
			};
		},
		[items, totalCount]
	);

	const narrowed = filters.length > 0 || search.trim().length > 0;

	const clearFilters = useCallback(() => {
		setFilters([]);
		setSearch('');
	}, []);

	return {
		items,
		setItems,
		loading,
		error,
		totalCount,
		hasMore,
		loadingMore,
		moreError,
		searching,
		search,
		setSearch,
		filters,
		setFilters,
		sortEntries,
		setSortEntries,
		sentinelRef,
		narrowed,
		clearFilters,
		load,
		loadMore,
		remove
	};
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
