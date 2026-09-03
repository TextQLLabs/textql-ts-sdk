import { Activity, FileText, Plus, Quote } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { titleCase } from '../lib/cells';
import { CELL_LABEL, CELL_META } from '../lib/cellText';
import { cx } from '../lib/cx';
import { INSIGHT_ITEMS, previewPanel, type PreviewItem } from '../lib/previewPanel';
import { useDismissable } from '../lib/useDismissable';
import type { IconComponent } from '../lib/icon';
import { FLYOUT, FLYOUT_ROW, FLYOUT_SEARCH, FLYOUT_SECTION, FLYOUT_STATE } from './pageStyles';

type Entry = {
	item: PreviewItem;
	icon: IconComponent;
	/** Right-hand hint: the count for an insight, the file kind for an asset. */
	hint: string;
};

type Group = { label: string; entries: Entry[] };

type Props = {
	/** The chat's assets, so any of them can be reopened after being closed. */
	catalog: PreviewItem[];
	citationCount: number;
};

/** The panel's "+": one menu over everything it can show. Tabs accumulate as
 *  you open them, so this is also how a closed one comes back. */
export function PreviewPicker({ catalog, citationCount }: Props) {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState('');
	const rootRef = useRef<HTMLDivElement | null>(null);
	const searchRef = useRef<HTMLInputElement | null>(null);

	useDismissable(open, () => setOpen(false), {
		contains: (target) => target instanceof Node && rootRef.current?.contains(target) === true
	});

	useEffect(() => {
		if (open) queueMicrotask(() => searchRef.current?.focus());
		else setQuery('');
	}, [open]);

	const groups = useMemo((): Group[] => {
		const needle = query.trim().toLowerCase();
		const matches = (entry: Entry) =>
			!needle || `${entry.item.name} ${entry.hint}`.toLowerCase().includes(needle);

		const insights: Entry[] = [
			{
				item: INSIGHT_ITEMS.citations,
				icon: Quote,
				hint: citationCount > 0 ? String(citationCount) : ''
			},
			{ item: INSIGHT_ITEMS.timeline, icon: Activity, hint: '' }
		];
		const assets: Entry[] = catalog.map((item) => ({
			item,
			icon: FileText,
			hint: titleCase(item.previewType) || 'File'
		}));

		return [
			{ label: 'Insights', entries: insights.filter(matches) },
			{ label: 'Files', entries: assets.filter(matches) }
		].filter((group) => group.entries.length > 0);
	}, [catalog, citationCount, query]);

	function openEntry(item: PreviewItem) {
		setOpen(false);
		previewPanel.openItem(item);
	}

	return (
		<div className="relative shrink-0 self-center" ref={rootRef}>
			<button
				type="button"
				className={cx(
					'inline-flex size-7 cursor-pointer items-center justify-center rounded-[7px] border-0 bg-transparent',
					open ? 'bg-ink/6 text-ink' : 'text-[#71717a] hover:bg-ink/5 hover:text-ink'
				)}
				aria-label="Open a view"
				aria-expanded={open}
				onClick={() => setOpen((current) => !current)}
			>
				<Plus size={15} />
			</button>

			{open && (
				<div
					className={cx(
						FLYOUT,
						'absolute top-[calc(100%+4px)] right-0 z-20 w-[min(272px,calc(100vw-32px))] animate-select-in motion-reduce:animate-none'
					)}
					role="menu"
					aria-label="Open a view"
				>
					<label className="block px-1.5 pt-1.5 pb-1">
						<span className="sr-only">Search views and files</span>
						<input
							ref={searchRef}
							className={FLYOUT_SEARCH}
							type="search"
							value={query}
							placeholder="Open any view, file, …"
							autoComplete="off"
							onChange={(event) => setQuery(event.target.value)}
						/>
					</label>

					<div className="max-h-[280px] overflow-y-auto pb-1">
						{groups.length === 0 ? (
							<p className={cx(FLYOUT_STATE, 'p-2')}>No matches.</p>
						) : (
							groups.map((group) => (
								<div className={FLYOUT_SECTION} key={group.label}>
									<span className={cx(CELL_LABEL, 'px-2 pt-1 pb-0.5 text-[#a1a1aa]')}>
										{group.label}
									</span>
									{group.entries.map((entry) => {
										const Icon = entry.icon;
										return (
											<button
												type="button"
												className={cx(FLYOUT_ROW, 'cursor-pointer bg-transparent hover:bg-fill')}
												key={entry.item.id}
												role="menuitem"
												onClick={() => openEntry(entry.item)}
											>
												<span className="inline-flex min-w-0 items-center gap-2">
													<Icon size={14} className="shrink-0 text-muted" />
													<span className="min-w-0 truncate font-medium">{entry.item.name}</span>
												</span>
												{entry.hint && (
													<span className={cx(CELL_META, 'shrink-0 text-muted tabular-nums')}>
														{entry.hint}
													</span>
												)}
											</button>
										);
									})}
								</div>
							))
						)}
					</div>
				</div>
			)}
		</div>
	);
}
