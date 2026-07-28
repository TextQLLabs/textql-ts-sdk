import {
	ArrowLeft,
	CalendarClock,
	ChevronDown,
	Database,
	ExternalLink,
	FileCode,
	MessageSquare,
	ShieldCheck,
	SquareFunction,
	Star,
	TriangleAlert
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import { attachAppBridge } from '../lib/appBridge';
import { cx } from '../lib/cx';
import { toEmbeddablePreviewUrl } from '../lib/previewUrl';
import { usePageTitle } from '../lib/usePageTitle';
import { isRecord, trimmedOrNull } from '../lib/utils';
import { RETRY_BTN } from './pageStyles';
import { UnicodeSpinner } from './UnicodeSpinner';

type DataSource = { type: string | null; name: string | null };
type ComputeFunction = {
	name: string | null;
	description: string | null;
	returns: string | null;
	paramCount: number;
};
type Capability = { type: string | null; name: string | null; connectorId: number | null };
type AppFile = { path: string; size: number };

type AppDetail = {
	id: string;
	name: string;
	description: string | null;
	code: string;
	htmlUrl: string | null;
	publishedHtmlUrl: string | null;
	screenshotUrl: string | null;
	chatId: string | null;
	folderId: string | null;
	isFavorited: boolean;
	hasUnpublishedChanges: boolean;
	scheduleEnabled: boolean;
	cronString: string | null;
	consoleErrors: string[];
	dataSources: DataSource[];
	computeFunctions: ComputeFunction[];
	capabilities: Capability[];
	files: AppFile[];
	createdAt: string | null;
	updatedAt: string | null;
	refreshedAt: string | null;
	publishedAt: string | null;
};

const BADGE =
	'inline-flex shrink-0 items-center gap-1 rounded-full bg-line/30 px-2 py-0.5 text-[10.5px] font-medium text-muted';
const BAR_BTN =
	'inline-flex items-center gap-1.5 rounded-sm border border-line/60 px-2.5 py-[5px] text-[12px] font-medium text-ink no-underline hover:border-[color-mix(in_srgb,var(--color-accent)_45%,var(--color-line))] hover:bg-elevate/60';
const STAGE_STATE =
	'absolute inset-0 flex flex-col items-center justify-center gap-2.5 p-6 text-center';
const STAGE_TEXT = 'm-0 text-[13px] text-muted';
const SECTION = 'flex flex-col gap-2.5';
const SECTION_TITLE =
	'm-0 flex items-center gap-1.5 font-sans text-[12px] font-semibold tracking-[0.05em] text-ink uppercase';
const SECTION_COUNT = 'font-mono text-[11px] font-medium text-muted';
const SECTION_EMPTY = 'm-0 text-[12.5px] text-muted';
const ROW_LIST = 'm-0 flex list-none flex-col gap-0.5 p-0';
/** `items-*`/`gap-*` are set per variant so the two never collide. */
const ROW = 'flex rounded-sm bg-elevate/45 px-2.5 py-[7px]';
const ROW_NAME =
	'min-w-0 overflow-hidden text-[12.5px] font-medium text-ellipsis whitespace-nowrap text-ink';
const ROW_TAG =
	'shrink-0 rounded-full bg-line/30 px-[7px] py-px text-[10.5px] font-medium text-muted';

function apiErrorDetail(payload: unknown, fallback: string): string {
	if (isRecord(payload) && typeof payload.error === 'string') return payload.error;
	return fallback;
}

function parseDetail(value: unknown): AppDetail | null {
	if (!isRecord(value) || typeof value.id !== 'string') return null;
	const dataSources = Array.isArray(value.dataSources)
		? value.dataSources
				.filter(isRecord)
				.map((d): DataSource => ({ type: trimmedOrNull(d.type), name: trimmedOrNull(d.name) }))
		: [];
	const computeFunctions = Array.isArray(value.computeFunctions)
		? value.computeFunctions.filter(isRecord).map(
				(f): ComputeFunction => ({
					name: trimmedOrNull(f.name),
					description: trimmedOrNull(f.description),
					returns: trimmedOrNull(f.returns),
					paramCount: typeof f.paramCount === 'number' ? f.paramCount : 0
				})
			)
		: [];
	const capabilities = Array.isArray(value.capabilities)
		? value.capabilities.filter(isRecord).map(
				(c): Capability => ({
					type: trimmedOrNull(c.type),
					name: trimmedOrNull(c.name),
					connectorId: typeof c.connectorId === 'number' ? c.connectorId : null
				})
			)
		: [];
	const files = Array.isArray(value.files)
		? value.files
				.filter(isRecord)
				.map((f): AppFile | null =>
					typeof f.path === 'string'
						? { path: f.path, size: typeof f.size === 'number' ? f.size : 0 }
						: null
				)
				.filter((f): f is AppFile => f !== null)
		: [];
	return {
		id: value.id,
		name: trimmedOrNull(value.name) ?? 'Untitled app',
		description: trimmedOrNull(value.description),
		code: typeof value.code === 'string' ? value.code : '',
		htmlUrl: trimmedOrNull(value.htmlUrl),
		publishedHtmlUrl: trimmedOrNull(value.publishedHtmlUrl),
		screenshotUrl: trimmedOrNull(value.screenshotUrl),
		chatId: trimmedOrNull(value.chatId),
		folderId: trimmedOrNull(value.folderId),
		isFavorited: value.isFavorited === true,
		hasUnpublishedChanges: value.hasUnpublishedChanges === true,
		scheduleEnabled: value.scheduleEnabled === true,
		cronString: trimmedOrNull(value.cronString),
		consoleErrors: Array.isArray(value.consoleErrors)
			? value.consoleErrors.filter((e): e is string => typeof e === 'string')
			: [],
		dataSources,
		computeFunctions,
		capabilities,
		files,
		createdAt: trimmedOrNull(value.createdAt),
		updatedAt: trimmedOrNull(value.updatedAt),
		refreshedAt: trimmedOrNull(value.refreshedAt),
		publishedAt: trimmedOrNull(value.publishedAt)
	};
}

function formatTimestamp(value: string | null): string | null {
	if (!value) return null;
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleString(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit'
	});
}

export function AppDetailPage() {
	const appId = useParams().id;

	const [app, setApp] = useState<AppDetail | undefined>();
	const [resolvedId, setResolvedId] = useState<string | undefined>();
	const [loadError, setLoadError] = useState<string | undefined>();
	const loadRequest = useRef<AbortController | undefined>(undefined);

	const [frameLoaded, setFrameLoaded] = useState(false);
	const [detailsOpen, setDetailsOpen] = useState(false);
	const frameRef = useRef<HTMLIFrameElement | null>(null);

	usePageTitle(app ? app.name : 'Data app');

	const showLoading = Boolean(appId && resolvedId !== appId && !loadError);
	const previewUrl = app ? toEmbeddablePreviewUrl(app.publishedHtmlUrl ?? app.htmlUrl) : null;
	const openUrl = app?.publishedHtmlUrl ?? app?.htmlUrl ?? null;

	const loadApp = useCallback(
		async (id: string, force = false) => {
			if (!force && resolvedId === id && app) return;

			loadRequest.current?.abort();
			const request = new AbortController();
			loadRequest.current = request;
			setLoadError(undefined);

			try {
				const response = await fetch(`/api/apps/${encodeURIComponent(id)}`, {
					signal: request.signal
				});
				const payload: unknown = await response.json();
				if (!response.ok) throw new Error(apiErrorDetail(payload, 'Unable to load app.'));
				if (!isRecord(payload)) throw new Error('Unable to load app.');

				const detail = parseDetail(payload.app);
				if (!detail) throw new Error('App not found.');

				setApp(detail);
				setResolvedId(id);
			} catch (error) {
				if (error instanceof DOMException && error.name === 'AbortError') return;
				setLoadError(error instanceof Error ? error.message : 'Unable to load app.');
			}
		},
		[app, resolvedId]
	);

	useEffect(() => {
		if (appId) void loadApp(appId);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- refetch on id change only
	}, [appId]);

	// New app document → show the loading veil again until the fresh frame reports load.
	useEffect(() => {
		setFrameLoaded(false);
	}, [previewUrl]);

	// Boots the sandboxed app and relays its ana.compute calls; torn down when the frame remounts.
	useEffect(() => {
		const node = frameRef.current;
		if (!node || !app || !previewUrl) return;
		return attachAppBridge(node, {
			appId: app.id,
			functionNames: app.computeFunctions
				.map((fn) => fn.name)
				.filter((name): name is string => name !== null)
		});
	}, [app, previewUrl]);

	const timestamps = app
		? [
				{ label: 'Created', value: formatTimestamp(app.createdAt) },
				{ label: 'Updated', value: formatTimestamp(app.updatedAt) },
				{ label: 'Refreshed', value: formatTimestamp(app.refreshedAt) },
				{ label: 'Published', value: formatTimestamp(app.publishedAt) }
			].filter((row) => row.value !== null)
		: [];

	return (
		<div className="flex h-full min-h-0 w-full flex-col bg-paper">
			<header className="flex shrink-0 items-center gap-2.5 border-b border-line/80 bg-[color-mix(in_srgb,var(--color-paper)_92%,var(--color-elevate))] px-3 py-[7px]">
				<Link
					className="inline-flex size-7 shrink-0 items-center justify-center rounded-sm text-muted hover:bg-elevate/70 hover:text-ink"
					to="/apps"
					aria-label="All data apps"
				>
					<ArrowLeft size={15} strokeWidth={2} />
				</Link>

				<div className="flex min-w-0 flex-1 items-center gap-2">
					<span
						className="min-w-0 overflow-hidden font-sans text-[14px] font-semibold -tracking-[0.01em] text-ellipsis whitespace-nowrap text-ink"
						title={app?.name}
					>
						{app?.name ?? 'Data app'}
					</span>
					{app?.isFavorited && (
						<Star size={13} strokeWidth={2} fill="currentColor" className="shrink-0 text-accent" />
					)}
					{app?.hasUnpublishedChanges && (
						<span
							className={cx(
								BADGE,
								'bg-[color-mix(in_srgb,var(--color-warn,#b58900)_16%,transparent)] text-[var(--color-warn,#b58900)]'
							)}
						>
							Unpublished changes
						</span>
					)}
					{app?.scheduleEnabled && (
						<span className={BADGE}>
							<CalendarClock size={11} strokeWidth={1.75} />
							{app.cronString ?? 'Scheduled'}
						</span>
					)}
				</div>

				<div className="flex shrink-0 items-center gap-1.5">
					{app?.chatId && (
						<Link className={BAR_BTN} to={`/chat/${app.chatId}`} title="Source chat">
							<MessageSquare size={14} strokeWidth={1.75} />
							<span className="max-[560px]:hidden">Chat</span>
						</Link>
					)}
					{openUrl && (
						<a className={BAR_BTN} href={openUrl} target="_blank" rel="noreferrer">
							<ExternalLink size={14} strokeWidth={1.75} />
							<span className="max-[560px]:hidden">Open</span>
						</a>
					)}
				</div>
			</header>

			<div className="relative min-h-0 flex-1 bg-[var(--color-bg,#fff)]">
				{showLoading ? (
					<div className={STAGE_STATE} aria-busy="true">
						<UnicodeSpinner label="Loading app" />
						<p className={STAGE_TEXT}>Loading app…</p>
					</div>
				) : loadError ? (
					<div className={STAGE_STATE}>
						<p className={STAGE_TEXT}>{loadError}</p>
						{appId && (
							<button
								type="button"
								className={RETRY_BTN}
								onClick={() => appId && loadApp(appId, true)}
							>
								Retry
							</button>
						)}
					</div>
				) : app && previewUrl ? (
					<>
						{/* The app renders here, full-bleed, exactly like the standalone /app view. */}
						<iframe
							key={previewUrl}
							ref={frameRef}
							className="absolute inset-0 size-full border-0"
							src={previewUrl}
							title={app.name}
							sandbox="allow-scripts"
							loading="lazy"
							onLoad={() => setFrameLoaded(true)}
						/>
						{!frameLoaded && (
							// Cosmetic only — never trap clicks meant for the app underneath.
							<div
								className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[var(--color-bg,#fff)]"
								aria-busy="true"
							>
								<UnicodeSpinner label="Rendering app" />
							</div>
						)}
					</>
				) : app?.screenshotUrl ? (
					<img
						className="absolute inset-0 size-full object-contain object-top"
						src={app.screenshotUrl}
						alt={`${app.name} preview`}
					/>
				) : app ? (
					<div className={STAGE_STATE}>
						<p className={STAGE_TEXT}>This app has no rendered preview yet.</p>
					</div>
				) : null}
			</div>

			{app && (
				<section className="shrink-0 border-t border-line/80 bg-[color-mix(in_srgb,var(--color-paper)_94%,var(--color-elevate))]">
					<button
						type="button"
						className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-3.5 py-[9px] text-[12.5px] font-semibold text-ink hover:bg-elevate/50"
						aria-expanded={detailsOpen}
						onClick={() => setDetailsOpen(!detailsOpen)}
					>
						<ChevronDown
							size={14}
							strokeWidth={2}
							className={cx(
								'transition-transform duration-[140ms] ease-[ease]',
								detailsOpen && 'rotate-180'
							)}
						/>
						<span>Details</span>
						<span className="text-[11.5px] font-normal text-muted">
							{app.dataSources.length} sources · {app.computeFunctions.length} functions ·{' '}
							{app.files.length} files
							{app.consoleErrors.length > 0 && (
								<>
									{' · '}
									<span className="text-[var(--color-danger,#d64545)]">{app.consoleErrors.length} errors</span>
								</>
							)}
						</span>
					</button>

					{detailsOpen && (
						<div className="flex max-h-[42vh] flex-col gap-4 overflow-y-auto px-4 pt-1 pb-5">
							{app.description && (
								<p className="m-0 max-w-[68ch] text-[13px] leading-normal text-muted">
									{app.description}
								</p>
							)}

							{app.consoleErrors.length > 0 && (
								<div
									className="rounded-md border border-[color-mix(in_srgb,var(--color-danger,#d64545)_40%,transparent)] bg-[color-mix(in_srgb,var(--color-danger,#d64545)_10%,transparent)] px-3.5 py-3"
									role="alert"
								>
									<p
										className="m-0 mb-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-[var(--color-danger,#d64545)]"
									>
										<TriangleAlert size={13} strokeWidth={2} />
										Console errors ({app.consoleErrors.length})
									</p>
									<ul className="m-0 pl-5 font-mono text-[11.5px] leading-normal text-muted">
										{app.consoleErrors.map((message, i) => (
											<li key={i}>{message}</li>
										))}
									</ul>
								</div>
							)}

							<div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
								<section className={SECTION}>
									<h2 className={SECTION_TITLE}>
										<Database size={13} strokeWidth={1.75} />
										Data sources
										<span className={SECTION_COUNT}>{app.dataSources.length}</span>
									</h2>
									{app.dataSources.length === 0 ? (
										<p className={SECTION_EMPTY}>No data sources.</p>
									) : (
										<ul className={ROW_LIST}>
											{app.dataSources.map((source, i) => (
												<li className={cx(ROW, 'items-center gap-2')} key={i}>
													<span className={ROW_NAME}>{source.name ?? 'Unnamed source'}</span>
													{source.type && (
														<span className={cx(ROW_TAG, 'ml-auto')}>{source.type}</span>
													)}
												</li>
											))}
										</ul>
									)}
								</section>

								<section className={SECTION}>
									<h2 className={SECTION_TITLE}>
										<SquareFunction size={13} strokeWidth={1.75} />
										Compute functions
										<span className={SECTION_COUNT}>{app.computeFunctions.length}</span>
									</h2>
									{app.computeFunctions.length === 0 ? (
										<p className={SECTION_EMPTY}>No compute functions.</p>
									) : (
										<ul className={ROW_LIST}>
											{app.computeFunctions.map((fn, i) => (
												<li className={cx(ROW, 'flex-col items-start gap-1')} key={i}>
													<span className="flex flex-wrap items-center gap-2">
														<span className={ROW_NAME}>{fn.name ?? 'Unnamed function'}</span>
														<span className={ROW_TAG}>{fn.paramCount} params</span>
														{fn.returns && <span className={ROW_TAG}>→ {fn.returns}</span>}
													</span>
													{fn.description && (
														<span className="text-[12px] leading-[1.45] text-muted">
															{fn.description}
														</span>
													)}
												</li>
											))}
										</ul>
									)}
								</section>

								<section className={SECTION}>
									<h2 className={SECTION_TITLE}>
										<ShieldCheck size={13} strokeWidth={1.75} />
										Capabilities
										<span className={SECTION_COUNT}>{app.capabilities.length}</span>
									</h2>
									{app.capabilities.length === 0 ? (
										<p className={SECTION_EMPTY}>No capabilities.</p>
									) : (
										<ul className={ROW_LIST}>
											{app.capabilities.map((cap, i) => (
												<li className={cx(ROW, 'items-center gap-2')} key={i}>
													<span className={ROW_NAME}>{cap.name ?? cap.type ?? 'Capability'}</span>
													{cap.connectorId !== null && (
														<span className={cx(ROW_TAG, 'ml-auto')}>
															connector {cap.connectorId}
														</span>
													)}
												</li>
											))}
										</ul>
									)}
								</section>

								<section className={SECTION}>
									<h2 className={SECTION_TITLE}>
										<FileCode size={13} strokeWidth={1.75} />
										Files
										<span className={SECTION_COUNT}>{app.files.length}</span>
									</h2>
									{app.files.length === 0 ? (
										<p className={SECTION_EMPTY}>No files.</p>
									) : (
										<ul className={ROW_LIST}>
											{app.files.map((file) => (
												<li className={cx(ROW, 'items-center gap-2')} key={file.path}>
													<span className={cx(ROW_NAME, 'font-mono text-[12px]')}>{file.path}</span>
													<span className={cx(ROW_TAG, 'ml-auto')}>
														{file.size.toLocaleString()} B
													</span>
												</li>
											))}
										</ul>
									)}
								</section>
							</div>

							{timestamps.length > 0 && (
								<section className={SECTION}>
									<h2 className={SECTION_TITLE}>Timeline</h2>
									<dl className="m-0 grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-2.5 [&_dd]:m-0 [&_dd]:text-[12.5px] [&_dd]:text-ink [&_dt]:text-[10.5px] [&_dt]:font-semibold [&_dt]:tracking-[0.05em] [&_dt]:text-muted [&_dt]:uppercase">
										{timestamps.map((row) => (
											<div className="flex flex-col gap-0.5" key={row.label}>
												<dt>{row.label}</dt>
												<dd>{row.value}</dd>
											</div>
										))}
									</dl>
								</section>
							)}
						</div>
					)}
				</section>
			)}
		</div>
	);
}
