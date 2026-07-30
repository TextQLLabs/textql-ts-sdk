import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import { formatCron } from '../lib/cron';
import { cx } from '../lib/cx';
import { applyFilters, type ColumnFilter } from '../lib/tableFilter';
import { applySort, type SortEntry } from '../lib/tableSort';
import { usePageDescription, usePageTitle } from '../lib/usePageTitle';
import { isRecord } from '../lib/utils';
import { Page } from '../primitives';
import { FilterToolbar } from './filterToolbar';
import type { FilterField } from './filterToolbar';
import { AgentIdenticon } from './AgentIdenticon';
import {
	BOARD,
	BOARD_GROUP,
	BOARD_GROUP_COUNT,
	BOARD_GROUP_HEAD,
	BOARD_GROUP_HINT,
	BOARD_GROUP_TITLE,
	BOARD_GROUP_TITLE_ROW,
	BOARD_LIST,
	LIST_SECTION_SCROLL,
	RETRY_BTN,
	STATE_BLOCK,
	STATE_TEXT,
	STATE_TITLE
} from './pageStyles';
import { UnicodeSpinner } from './UnicodeSpinner';

type AgentListItem = {
	id: string;
	name: string;
	prompt: string;
	isActive: boolean;
	profileImageUrl: string | null;
	ownerName: string | null;
	llmModel: string | null;
	schedules: string[];
	lastPostAt: string | null;
};

type AgentGroup = {
	key: 'active' | 'inactive';
	title: string;
	hint: string;
	agents: AgentListItem[];
};

const META = 'min-w-0 overflow-hidden font-sans text-[11.5px] leading-[1.35] text-ellipsis whitespace-nowrap text-muted';

function formatLastPost(value: string | null) {
	if (!value) return 'Never posted';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return 'Never posted';

	const today = new Date();
	const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const dayDiff = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86_400_000);

	if (dayDiff === 0) return 'Posted today';
	if (dayDiff === 1) return 'Posted yesterday';
	return `Posted ${date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
	})}`;
}

function scheduleLabel(agent: AgentListItem) {
	if (agent.schedules.length === 0) return 'No schedule';
	if (agent.schedules.length === 1) return formatCron(agent.schedules[0]);
	return `${agent.schedules.length} schedules`;
}

function parseAgent(item: unknown): AgentListItem | null {
	if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') {
		return null;
	}
	return {
		id: item.id,
		name: item.name,
		prompt: typeof item.prompt === 'string' ? item.prompt : '',
		isActive: item.isActive === true,
		profileImageUrl: typeof item.profileImageUrl === 'string' ? item.profileImageUrl : null,
		ownerName: typeof item.ownerName === 'string' ? item.ownerName : null,
		llmModel: typeof item.llmModel === 'string' ? item.llmModel : null,
		schedules: Array.isArray(item.schedules)
			? item.schedules.filter((cron): cron is string => typeof cron === 'string')
			: [],
		lastPostAt: typeof item.lastPostAt === 'string' ? item.lastPostAt : null
	};
}

export function AgentsPage() {
	usePageTitle('Agents');
	usePageDescription('Browse the agents in your workspace.');

	const [agents, setAgents] = useState<AgentListItem[]>([]);
	const [search, setSearch] = useState('');
	const [filters, setFilters] = useState<ColumnFilter[]>([]);
	const [sortEntries, setSortEntries] = useState<SortEntry[]>([
		{ columnId: 'lastPost', dir: 'desc' }
	]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	async function loadAgents() {
		setLoading(true);
		setError(false);

		try {
			const response = await fetch('/api/agents');
			const payload: unknown = await response.json();

			if (!response.ok || !isRecord(payload) || !Array.isArray(payload.agents)) {
				throw new Error('Unable to load agents.');
			}

			setAgents(
				payload.agents.map(parseAgent).filter((item): item is AgentListItem => item !== null)
			);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		void loadAgents();
	}, []);

	// ListAgents takes no search/sort/paging params, so this surface filters
	// client-side: facet options come from the loaded rows via `items`.
	const fields = useMemo<FilterField<AgentListItem>[]>(
		() => [
			{
				id: 'lastPost',
				header: 'Last post',
				sortable: true,
				sortType: 'date',
				sortValue: (agent) => (agent.lastPostAt ? new Date(agent.lastPostAt) : null)
			},
			{ id: 'name', header: 'Name', sortable: true, sortType: 'text' },
			{
				id: 'status',
				header: 'Status',
				filterable: true,
				filterValue: (agent) => (agent.isActive ? 'Active' : 'Inactive')
			},
			{
				id: 'ownerName',
				header: 'Owner',
				filterable: true,
				filterKind: 'people',
				filterValue: (agent) => agent.ownerName ?? ''
			},
			{
				id: 'llmModel',
				header: 'Model',
				filterable: true,
				filterValue: (agent) => agent.llmModel ?? ''
			},
			{
				id: 'schedule',
				header: 'Schedule',
				filterable: true,
				filterValue: (agent) => (agent.schedules.length ? 'Scheduled' : 'No schedule')
			}
		],
		[]
	);

	const fieldMap = useMemo(() => new Map(fields.map((field) => [field.id, field])), [fields]);

	const narrowed = filters.length > 0 || search.trim().length > 0;

	/** Search matches name, prompt and owner; facets and sort run on the result. */
	const visibleAgents = useMemo(() => {
		const q = search.trim().toLowerCase();
		const searched = q
			? agents.filter((agent) =>
					[agent.name, agent.prompt, agent.ownerName ?? ''].some((text) =>
						text.toLowerCase().includes(q)
					)
				)
			: agents;
		return applySort(applyFilters(searched, filters, fieldMap), sortEntries, fieldMap);
	}, [agents, search, filters, sortEntries, fieldMap]);

	const active = visibleAgents.filter((agent) => agent.isActive);
	const inactive = visibleAgents.filter((agent) => !agent.isActive);
	const groups: AgentGroup[] = [];
	if (active.length) {
		groups.push({ key: 'active', title: 'Active', hint: 'Currently running', agents: active });
	}
	if (inactive.length) {
		groups.push({
			key: 'inactive',
			title: 'Inactive',
			hint: 'Paused — won’t run',
			agents: inactive
		});
	}

	return (
		<Page title="Agents" lead="Browse the agents in your workspace." wide>
			<FilterToolbar
				fields={fields}
				items={agents}
				placeholder="Search agents…"
				search={search}
				onSearchChange={setSearch}
				filters={filters}
				onFiltersChange={setFilters}
				sortEntries={sortEntries}
				onSortChange={setSortEntries}
			/>

			<section className={LIST_SECTION_SCROLL} aria-label="Agent list">
				{loading ? (
					<div className={STATE_BLOCK} aria-busy="true">
						<UnicodeSpinner label="Loading agents" />
						<p className={STATE_TEXT}>Loading agents…</p>
					</div>
				) : error ? (
					<div className={STATE_BLOCK}>
						<p className={STATE_TEXT}>Unable to load agents.</p>
						<button type="button" className={RETRY_BTN} onClick={loadAgents}>
							Retry
						</button>
					</div>
				) : visibleAgents.length === 0 ? (
					<div className={STATE_BLOCK}>
						<p className={STATE_TITLE}>{narrowed ? 'No matching agents' : 'No agents yet'}</p>
						<p className={STATE_TEXT}>
							{narrowed
								? 'Try clearing a filter or searching for something else.'
								: 'Agents you create will show up here.'}
						</p>
						{narrowed && (
							<button
								type="button"
								className={RETRY_BTN}
								onClick={() => {
									setFilters([]);
									setSearch('');
								}}
							>
								Clear filters
							</button>
						)}
					</div>
				) : (
					<div className={BOARD}>
						{groups.map((group) => (
							<section key={group.key} className={BOARD_GROUP} aria-label={group.title}>
								<header className={BOARD_GROUP_HEAD}>
									<div className={BOARD_GROUP_TITLE_ROW}>
										<h2 className={BOARD_GROUP_TITLE}>{group.title}</h2>
										<span className={BOARD_GROUP_COUNT}>{group.agents.length}</span>
									</div>
									<p className={BOARD_GROUP_HINT}>{group.hint}</p>
								</header>

								<ul className={BOARD_LIST}>
									{group.agents.map((agent) => (
										<li key={agent.id}>
											<Link
												className="grid min-w-0 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-sm p-2.5 text-inherit no-underline transition-[background] duration-[120ms] hover:bg-elevate/70 max-[560px]:grid-cols-[auto_minmax(0,1fr)] max-[560px]:gap-y-1.5"
												to={`/agents/${agent.id}`}
											>
												<span className="inline-flex size-[30px] shrink-0 items-center justify-center overflow-hidden rounded-sm bg-line/30 text-ink">
													{agent.profileImageUrl ? (
														<img
															className="size-full object-cover"
															src={agent.profileImageUrl}
															alt=""
															loading="lazy"
														/>
													) : (
														<AgentIdenticon
															name={agent.name}
															agentId={agent.id}
															isActive={agent.isActive}
															size={30}
														/>
													)}
												</span>

												<span className="flex min-w-0 flex-col gap-0.5">
													<span className="flex min-w-0 items-center gap-2">
														<span
															className={cx(
																'min-w-0 overflow-hidden font-sans text-[13px] font-medium text-ellipsis whitespace-nowrap',
																group.key === 'inactive'
																	? 'text-[color-mix(in_srgb,var(--color-ink)_72%,var(--color-muted))]'
																	: 'text-ink'
															)}
															title={agent.name}
														>
															{agent.name}
														</span>
														{agent.llmModel && (
															<span className="shrink-0 rounded-full bg-line/30 px-1.5 py-px text-[10px] font-medium tracking-[0.02em] text-muted">
																{agent.llmModel}
															</span>
														)}
													</span>
													<span className="flex min-w-0 items-center gap-2.5">
														<span className={META} title={agent.schedules[0] ?? undefined}>
															{scheduleLabel(agent)}
														</span>
														{agent.ownerName && (
															<span className={META} title={agent.ownerName}>
																{agent.ownerName}
															</span>
														)}
													</span>
												</span>

												<span className="shrink-0 text-[11.5px] whitespace-nowrap text-muted max-[560px]:col-start-2">
													{formatLastPost(agent.lastPostAt)}
												</span>
											</Link>
										</li>
									))}
								</ul>
							</section>
						))}
					</div>
				)}
			</section>
		</Page>
	);
}
