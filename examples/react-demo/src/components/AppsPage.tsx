import { CalendarClock, Database, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { cx } from '../lib/cx';
import { usePageDescription, usePageTitle } from '../lib/usePageTitle';
import { isRecord } from '../lib/utils';
import { Page } from '../primitives';
import { LIST_SECTION_SCROLL, RETRY_BTN, STATE_BLOCK, STATE_TEXT, STATE_TITLE } from './pageStyles';
import { UnicodeSpinner } from './UnicodeSpinner';

type AppListItem = {
	id: string;
	name: string;
	description: string | null;
	screenshotUrl: string | null;
	isFavorited: boolean;
	hasUnpublishedChanges: boolean;
	scheduleEnabled: boolean;
	dataSourceCount: number;
	updatedAt: string | null;
};

const TAG =
	'inline-flex items-center gap-1 rounded-full bg-line/30 px-[7px] py-px text-[10.5px] font-medium text-muted';

function monogram(name: string): string {
	return name?.trim().charAt(0).toUpperCase() || 'A';
}

function formatUpdated(value: string | null) {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	const today = new Date();
	return `Updated ${date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
	})}`;
}

function parseApp(item: unknown): AppListItem | null {
	if (!isRecord(item) || typeof item.id !== 'string') return null;
	return {
		id: item.id,
		name: typeof item.name === 'string' ? item.name : 'Untitled app',
		description: typeof item.description === 'string' ? item.description : null,
		screenshotUrl: typeof item.screenshotUrl === 'string' ? item.screenshotUrl : null,
		isFavorited: item.isFavorited === true,
		hasUnpublishedChanges: item.hasUnpublishedChanges === true,
		scheduleEnabled: item.scheduleEnabled === true,
		dataSourceCount: typeof item.dataSourceCount === 'number' ? item.dataSourceCount : 0,
		updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : null
	};
}

export function AppsPage() {
	usePageTitle('Data apps');
	usePageDescription('Browse the data apps in your workspace.');

	const [apps, setApps] = useState<AppListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	async function loadApps() {
		setLoading(true);
		setError(false);

		try {
			const response = await fetch('/api/apps');
			const payload: unknown = await response.json();

			if (!response.ok || !isRecord(payload) || !Array.isArray(payload.apps)) {
				throw new Error('Unable to load apps.');
			}

			setApps(payload.apps.map(parseApp).filter((item): item is AppListItem => item !== null));
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void loadApps();
	}, []);

	return (
		<Page title="Data apps" lead="Browse the data apps in your workspace." wide>
			<section className={LIST_SECTION_SCROLL} aria-label="Data app list">
				{loading ? (
					<div className={STATE_BLOCK} aria-busy="true">
						<UnicodeSpinner label="Loading apps" />
						<p className={STATE_TEXT}>Loading apps…</p>
					</div>
				) : error ? (
					<div className={STATE_BLOCK}>
						<p className={STATE_TEXT}>Unable to load apps.</p>
						<button type="button" className={RETRY_BTN} onClick={loadApps}>
							Retry
						</button>
					</div>
				) : apps.length === 0 ? (
					<div className={STATE_BLOCK}>
						<p className={STATE_TITLE}>No data apps yet</p>
						<p className={STATE_TEXT}>Data apps you create will show up here.</p>
					</div>
				) : (
					<ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-3 p-0">
						{apps.map((app) => {
							const updated = formatUpdated(app.updatedAt);
							return (
								<li key={app.id}>
									<Link
										className="flex h-full flex-col overflow-hidden rounded-md border border-line/60 bg-elevate/40 text-inherit no-underline transition-[background,border-color] duration-[120ms] hover:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-line))] hover:bg-elevate/70"
										to={`/apps/${app.id}`}
									>
										{/* Dot-grid tile behind card previews so any app palette sits well on the surface. */}
										<span
											className="relative flex h-32 shrink-0 items-center justify-center overflow-hidden bg-[var(--color-bg,#fff)] bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-accent)_12%,transparent)_1px,transparent_1.5px)] bg-[length:14px_14px]"
											aria-hidden="true"
										>
											{app.screenshotUrl ? (
												// Screenshot framed as a mini window rising from the card body.
												// Corners are 8px — `rounded-t-lg` would be 16px (--radius-lg).
												<span className="absolute inset-x-6 top-5 bottom-0 flex flex-col overflow-hidden rounded-t-[8px] border border-b-0 border-line/60 bg-[var(--color-bg,#fff)] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.25)]">
													<span className="flex h-[18px] shrink-0 items-center gap-[5px] border-b border-line/40 bg-[var(--color-bg,#fff)] px-2">
														<span className="size-[5px] rounded-full bg-line/70" />
														<span className="size-[5px] rounded-full bg-line/70" />
														<span className="size-[5px] rounded-full bg-line/70" />
													</span>
													<img
														className="min-h-0 w-full flex-1 object-cover object-top"
														src={app.screenshotUrl}
														alt=""
														loading="lazy"
													/>
													{/* Fade the preview into the card body so the cut-off isn't abrupt. */}
													<span className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-[var(--color-bg,#fff)]" />
												</span>
											) : (
												<span className="inline-flex size-[52px] items-center justify-center rounded-[12px] border border-line/60 bg-[var(--color-bg,#fff)] font-sans text-[22px] font-[650] text-accent shadow-[var(--shadow-sm,0_1px_2px_rgba(0,0,0,0.06))]">
													{monogram(app.name)}
												</span>
											)}
											{app.isFavorited && (
												<Star
													className="absolute top-2 right-2 text-accent"
													size={14}
													strokeWidth={2}
													fill="currentColor"
												/>
											)}
										</span>

										<span className="flex min-w-0 flex-col gap-[5px] p-3">
											<span
												className="overflow-hidden font-sans text-[13.5px] font-semibold text-ellipsis whitespace-nowrap text-ink"
												title={app.name}
											>
												{app.name}
											</span>
											{app.description && (
												<span className="line-clamp-2 overflow-hidden text-[12px] leading-[1.45] text-muted">
													{app.description}
												</span>
											)}

											<span className="mt-[3px] flex flex-wrap items-center gap-2">
												<span className={TAG} title="Data sources">
													<Database size={12} strokeWidth={1.75} />
													{app.dataSourceCount}
												</span>
												{app.scheduleEnabled && (
													<span className={TAG} title="Scheduled">
														<CalendarClock size={12} strokeWidth={1.75} />
														Scheduled
													</span>
												)}
												{app.hasUnpublishedChanges && (
													<span
														className={cx(
															TAG,
															'bg-[color-mix(in_srgb,var(--color-warn,#b58900)_16%,transparent)] text-[var(--color-warn,#b58900)]'
														)}
														title="Unpublished changes"
													>
														Draft
													</span>
												)}
												{updated && (
													<span className="text-[10.5px] whitespace-nowrap text-muted">{updated}</span>
												)}
											</span>
										</span>
									</Link>
								</li>
							);
						})}
					</ul>
				)}
			</section>
		</Page>
	);
}
