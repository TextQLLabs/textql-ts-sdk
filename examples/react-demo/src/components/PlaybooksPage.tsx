import { Bell, Ellipsis, Eye, FilePen, Hash, Pencil, Plus, Share2, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { CHAT_MODELS, DEFAULT_CHAT_MODEL, isKnownChatModel } from '../lib/chatModels';
import { connectorIconSrc } from '../lib/connectorIcons';
import { connectorsCache, useConnectors } from '../lib/connectorsCache';
import { cronToHuman, formatCron } from '../lib/cron';
import {
	cronToSchedule,
	defaultSchedule,
	ordinal,
	scheduleToCron,
	WEEKDAY_OPTIONS,
	type CronSchedule,
	type ScheduleFrequency
} from '../lib/cronSchedule';
import { cx } from '../lib/cx';
import { promptViewPref, usePromptView } from '../lib/promptViewPref';
import { slackChannelsCache, useSlackChannels } from '../lib/slackChannelsCache';
import { usePageDescription, usePageTitle } from '../lib/usePageTitle';
import { loadMemberOptions, usePagedList } from '../lib/usePagedList';
import { isRecord } from '../lib/utils';
import { Page, Select, confirm, toast, type SelectOption } from '../primitives';
import { Markdown } from './Markdown';
import { FilterToolbar } from './filterToolbar';
import type { FilterField, FilterOption } from './filterToolbar';
import {
	BOARD,
	BOARD_END,
	BOARD_GROUP,
	BOARD_GROUP_COUNT,
	BOARD_GROUP_HEAD,
	BOARD_GROUP_HINT,
	BOARD_GROUP_TITLE,
	BOARD_GROUP_TITLE_ROW,
	BOARD_MORE,
	LIST_SECTION_SCROLL,
	MENU_BTN_BASE,
	MENU_BTN_HIDDEN,
	MENU_BTN_SHOWN,
	MENU_ITEM,
	MENU_POPOVER,
	MENU_WRAP,
	NEW_BTN,
	RETRY_BTN,
	ROW_SPINNER,
	STATE_BLOCK,
	STATE_TEXT,
	STATE_TITLE
} from './pageStyles';
import { UnicodeSpinner } from './UnicodeSpinner';

type PlaybookListItem = {
	id: string;
	name: string;
	status: string;
	cronString: string | null;
	ownerName: string | null;
	updatedAt: string | null;
	isRunning: boolean;
};

type PlaybookDetail = {
	id: string;
	name: string;
	prompt: string;
	status: string;
	triggerType: string;
	cronString: string;
	llmModel: string | null;
	connectorIds: number[];
	emailAddresses: string[];
	slackChannelId: string | null;
	isRunning: boolean;
	updatedAt: string | null;
	createdAt: string | null;
};

const PLAYBOOK_UUID_RE =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field wrapper (`<div>` or `<fieldset>`); grouped controls use the wider gap. */
const FIELD = 'm-0 flex min-w-0 flex-col gap-1.5 border-0 p-0';
const FIELD_WIDE = 'm-0 flex min-w-0 flex-col gap-2 border-0 p-0';
const FIELD_LABEL =
	'inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.01em] text-muted';
const FIELD_HINT = 'm-0 text-[12px] text-muted';

/**
 * Shared input box. Width and line-height stay with each caller because the raw
 * cron input flexes instead of filling and the textarea uses a taller leading.
 */
const FIELD_INPUT =
	'rounded-sm border border-line/85 bg-elevate/78 px-[11px] py-[9px] text-[13px] text-ink focus:border-accent focus:shadow-[inset_0_0_0_1px_var(--color-accent)] focus:outline-none focus-visible:border-accent focus-visible:shadow-[inset_0_0_0_1px_var(--color-accent)] focus-visible:outline-none';

/** Header action button; each variant supplies its own colour/background branch. */
const ACTION_BTN =
	'inline-flex cursor-pointer items-center justify-center gap-[5px] rounded-sm border-0 px-[9px] py-[5px] text-[12px] font-medium no-underline transition-[background] duration-[120ms] disabled:cursor-not-allowed disabled:opacity-55';
const ACTION_BTN_NEUTRAL =
	'bg-elevate/70 text-text-2 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_75%,transparent)] hover:not-disabled:bg-elevate/92';

/** Inline retry drops the horizontal padding, so it can't layer over RETRY_BTN. */
const RETRY_BTN_INLINE =
	'cursor-pointer self-start rounded-sm border-0 bg-transparent px-0 py-1.5 text-[12.5px] text-accent hover:bg-elevate/60';

/** Row sub-line (schedule / owner); the font size differs per row density. */
const ROW_META =
	'min-w-0 overflow-hidden font-sans leading-[1.35] text-ellipsis whitespace-nowrap text-muted';

/** Write / Preview segmented toggle. */
const SEG_BTN =
	'inline-flex cursor-pointer items-center gap-[5px] rounded-xs border-0 px-2.5 py-[3px] text-[11.5px] font-medium transition-[background,color] duration-[120ms] hover:text-ink';

const STATUS_DOT: Record<string, string> = {
	active: 'bg-[#4ade80]',
	draft: 'bg-[#fbbf24]',
	inactive: 'bg-[#a8a29e]'
};

const frequencyOptions: SelectOption<ScheduleFrequency>[] = [
	{ value: 'hourly', label: 'Every hour' },
	{ value: 'daily', label: 'Every day' },
	{ value: 'weekly', label: 'Every week' },
	{ value: 'monthly', label: 'Every month' },
	{ value: 'custom', label: 'Custom (cron)' }
];

const weekdayOptions: SelectOption<number>[] = WEEKDAY_OPTIONS.map((day) => ({
	value: day.value,
	label: day.label
}));

const dayOfMonthOptions: SelectOption<number>[] = Array.from({ length: 31 }, (_, i) => ({
	value: i + 1,
	label: ordinal(i + 1)
}));

const hourOptions: SelectOption<number>[] = Array.from({ length: 12 }, (_, i) => ({
	value: i + 1,
	label: String(i + 1).padStart(2, '0')
}));

const minuteOptions: SelectOption<number>[] = Array.from({ length: 60 }, (_, i) => ({
	value: i,
	label: String(i).padStart(2, '0')
}));

const periodOptions: SelectOption<string>[] = [
	{ value: 'AM', label: 'AM' },
	{ value: 'PM', label: 'PM' }
];

function statusLabel(status: string) {
	if (status === 'STATUS_ACTIVE') return 'Active';
	if (status === 'STATUS_INACTIVE') return 'Inactive';
	return 'Draft';
}

function statusTone(status: string) {
	if (status === 'STATUS_ACTIVE') return 'active';
	if (status === 'STATUS_INACTIVE') return 'inactive';
	return 'draft';
}

function apiErrorDetail(payload: unknown, fallback: string): string {
	if (!isRecord(payload)) return fallback;
	if (typeof payload.error === 'string') return payload.error;
	if (typeof payload.message === 'string') return payload.message;
	return fallback;
}

function formatUpdated(value: string | null) {
	if (!value) return '—';
	const date = new Date(value);
	if (Number.isNaN(date.getTime())) return '—';

	const today = new Date();
	const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
	const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	const dayDiff = Math.round((startOfToday.getTime() - startOfDay.getTime()) / 86_400_000);

	if (dayDiff === 0) return 'Today';
	if (dayDiff === 1) return 'Yesterday';
	return date.toLocaleDateString(undefined, {
		month: 'short',
		day: 'numeric',
		year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
	});
}

function parseListItem(item: unknown): PlaybookListItem | null {
	if (
		!isRecord(item) ||
		typeof item.id !== 'string' ||
		typeof item.name !== 'string' ||
		typeof item.status !== 'string'
	) {
		return null;
	}
	return {
		id: item.id,
		name: item.name,
		status: item.status,
		cronString: typeof item.cronString === 'string' ? item.cronString : null,
		ownerName: typeof item.ownerName === 'string' ? item.ownerName : null,
		updatedAt:
			typeof item.updatedAt === 'string' || item.updatedAt === null ? item.updatedAt : null,
		isRunning: item.isRunning === true
	};
}

function parseDetail(item: unknown): PlaybookDetail | null {
	if (!isRecord(item) || typeof item.id !== 'string' || typeof item.name !== 'string') {
		return null;
	}
	return {
		id: item.id,
		name: item.name,
		prompt: typeof item.prompt === 'string' ? item.prompt : '',
		status: typeof item.status === 'string' ? item.status : 'STATUS_UNKNOWN',
		triggerType: typeof item.triggerType === 'string' ? item.triggerType : 'TRIGGER_TYPE_UNKNOWN',
		cronString: typeof item.cronString === 'string' ? item.cronString : '',
		llmModel: typeof item.llmModel === 'string' ? item.llmModel : null,
		connectorIds: Array.isArray(item.connectorIds)
			? item.connectorIds.filter(
					(id): id is number => typeof id === 'number' && Number.isInteger(id)
				)
			: [],
		emailAddresses: Array.isArray(item.emailAddresses)
			? item.emailAddresses.filter((email): email is string => typeof email === 'string')
			: [],
		slackChannelId: typeof item.slackChannelId === 'string' ? item.slackChannelId : null,
		isRunning: item.isRunning === true,
		updatedAt:
			typeof item.updatedAt === 'string' || item.updatedAt === null ? item.updatedAt : null,
		createdAt: typeof item.createdAt === 'string' || item.createdAt === null ? item.createdAt : null
	};
}

type BoardGroup = {
	key: 'active' | 'draft' | 'inactive';
	title: string;
	hint: string;
	items: PlaybookListItem[];
};

export function PlaybooksPage() {
	const navigate = useNavigate();
	const routeId = useParams().id;
	const promptView = usePromptView();
	const connectors = useConnectors();
	const slack = useSlackChannels();

	const [creatorOptions, setCreatorOptions] = useState<FilterOption[]>([]);

	const list = usePagedList<PlaybookListItem>({
		endpoint: '/api/playbooks',
		rowsKey: 'playbooks',
		defaultSort: [{ columnId: 'updated', dir: 'desc' }],
		parse: parseListItem
	});

	const playbooks = list.items;
	const setPlaybooks = list.setItems;

	// Applied server-side by /api/playbooks, so the toolbar gets no rows and each
	// facet declares its own options.
	const fields = useMemo<FilterField[]>(
		() => [
			{ id: 'updated', header: 'Last updated', sortable: true, sortType: 'date' },
			{ id: 'created', header: 'Created', sortable: true, sortType: 'date' },
			{ id: 'name', header: 'Name', sortable: true, sortType: 'text' },
			{ id: 'schedule', header: 'Schedule', sortable: true, sortType: 'text' },
			{
				id: 'creator',
				header: 'Owner',
				filterable: true,
				filterKind: 'people',
				filterOptions: creatorOptions
			},
			{
				id: 'status',
				header: 'Status',
				filterable: true,
				filterOptions: [
					{ value: 'STATUS_ACTIVE', label: 'Active' },
					{ value: 'STATUS_INACTIVE', label: 'Inactive' },
					{ value: 'STATUS_EMPTY', label: 'Draft' }
				]
			},
			{
				id: 'scope',
				header: 'Playbooks',
				filterable: true,
				filterOptions: [
					{ value: 'shared', label: 'Shared with me', icon: Share2 },
					{ value: 'subscribed', label: 'Subscribed', icon: Bell },
					// Orthogonal to `shared`: widens *draft* visibility to any member/role
					// share, where `shared` excludes anything you authored.
					{ value: 'drafts', label: 'Include shared drafts', icon: FilePen }
				]
			}
		],
		[creatorOptions]
	);
	const [creating, setCreating] = useState(false);
	const [menuPlaybookId, setMenuPlaybookId] = useState<string | undefined>();
	const [deletingId, setDeletingId] = useState<string | undefined>();
	const [openingId, setOpeningId] = useState<string | undefined>();

	const [playbook, setPlaybook] = useState<PlaybookDetail | undefined>();
	const [resolvedId, setResolvedId] = useState<string | undefined>();
	const [loadError, setLoadError] = useState<string | undefined>();
	const loadRequest = useRef<AbortController | undefined>(undefined);

	const [name, setName] = useState('');
	const [prompt, setPrompt] = useState('');
	const [schedule, setSchedule] = useState<CronSchedule>(defaultSchedule());
	const [llmModel, setLlmModel] = useState<string>(DEFAULT_CHAT_MODEL);
	const [connectorIds, setConnectorIds] = useState<number[]>([]);
	const [emails, setEmails] = useState<string[]>([]);
	const [emailDraft, setEmailDraft] = useState('');
	const [emailError, setEmailError] = useState<string | undefined>();
	const [slackChannelId, setSlackChannelId] = useState('');

	const [saving, setSaving] = useState(false);
	const [deploying, setDeploying] = useState(false);
	const [deactivating, setDeactivating] = useState(false);
	const [actionError, setActionError] = useState<string | undefined>();

	const cronString = scheduleToCron(schedule);
	const schedulePreview = (() => {
		const cron = cronString.trim();
		if (!cron) return 'No schedule — runs only when triggered manually.';
		return cronToHuman(cron) ?? `Custom schedule (${cron})`;
	})();

	const selectedSlackChannel = slackChannelId
		? slack.channels.find((channel) => channel.channelId === slackChannelId)
		: undefined;

	const modelOptions: SelectOption<string>[] = CHAT_MODELS.map((model) => ({
		value: model.id,
		label: model.label,
		hint: model.hint,
		iconSrc: connectorIconSrc(model.provider)
	}));

	const slackOptions: SelectOption<string>[] = (() => {
		const options: SelectOption<string>[] = [{ value: '', label: 'No channel — email only' }];
		for (const channel of slack.channels) {
			options.push({ value: channel.channelId, label: `#${channel.name}` });
		}
		if (slackChannelId && !selectedSlackChannel) {
			options.push({
				value: slackChannelId,
				label: `${slackChannelId} (not in workspace)`
			});
		}
		return options;
	})();

	const hour12 = schedule.hour % 12 === 0 ? 12 : schedule.hour % 12;
	const period = schedule.hour >= 12 ? 'PM' : 'AM';

	function setHour12(value: number) {
		const base = value % 12;
		setSchedule((current) => ({
			...current,
			hour: current.hour >= 12 ? base + 12 : base
		}));
	}

	function setMinute(value: number) {
		setSchedule((current) => ({ ...current, minute: value }));
	}

	function setPeriod(value: string) {
		setSchedule((current) => ({
			...current,
			hour: value === 'PM' ? (current.hour % 12) + 12 : current.hour % 12
		}));
	}

	const actionBusy = saving || deploying || deactivating || deletingId !== undefined;

	const showLoading = (() => {
		if (!routeId) return false;
		if (loadError && resolvedId !== routeId) return false;
		if (resolvedId === routeId && playbook) return false;
		return true;
	})();
	const showError = Boolean(routeId && loadError && resolvedId !== routeId && !showLoading);
	const showList = !routeId;
	const showEditor = Boolean(routeId && playbook && resolvedId === routeId && !showLoading);

	const isDirty = (() => {
		if (!playbook) return false;
		const savedEmails = [...playbook.emailAddresses]
			.map((e) => e.trim())
			.filter(Boolean)
			.sort()
			.join(',');
		const draftEmails = [...emails]
			.map((e) => e.trim())
			.filter(Boolean)
			.sort()
			.join(',');
		const savedConnectors = [...playbook.connectorIds].sort().join(',');
		const draftConnectors = [...connectorIds].sort().join(',');
		const savedModel =
			playbook.llmModel && isKnownChatModel(playbook.llmModel)
				? playbook.llmModel
				: DEFAULT_CHAT_MODEL;
		return (
			name !== playbook.name ||
			prompt !== playbook.prompt ||
			cronString !== (playbook.cronString ?? '') ||
			llmModel !== savedModel ||
			savedConnectors !== draftConnectors ||
			savedEmails !== draftEmails ||
			slackChannelId !== (playbook.slackChannelId ?? '')
		);
	})();

	const pageTitle = showList ? 'Playbooks' : name.trim() || playbook?.name || 'Playbook';
	usePageTitle(pageTitle);
	usePageDescription('Create and manage scheduled playbooks.');

	const pageLead = (() => {
		if (showList) return 'Create and manage scheduled playbooks.';
		if (!playbook) return undefined;
		const parts = [statusLabel(playbook.status)];
		if (isDirty) parts.push('Unsaved');
		if (playbook.isRunning) parts.push('Running');
		return parts.join(' · ');
	})();

	const boardGroups: BoardGroup[] = (() => {
		const active: PlaybookListItem[] = [];
		const draft: PlaybookListItem[] = [];
		const inactive: PlaybookListItem[] = [];
		for (const item of playbooks) {
			const tone = statusTone(item.status);
			if (tone === 'active') active.push(item);
			else if (tone === 'inactive') inactive.push(item);
			else draft.push(item);
		}
		const groups: BoardGroup[] = [];
		if (active.length) {
			groups.push({
				key: 'active',
				title: 'Live',
				hint: 'Currently deployed',
				items: active
			});
		}
		if (draft.length) {
			groups.push({
				key: 'draft',
				title: 'Drafts',
				hint: 'Not deployed yet',
				items: draft
			});
		}
		if (inactive.length) {
			groups.push({
				key: 'inactive',
				title: 'Paused',
				hint: 'Deactivated — won’t run',
				items: inactive
			});
		}
		return groups;
	})();

	const applyPlaybook = useCallback((detail: PlaybookDetail) => {
		setPlaybook(detail);
		setResolvedId(detail.id);
		setName(detail.name);
		setPrompt(detail.prompt);
		setSchedule(cronToSchedule(detail.cronString));
		setLlmModel(
			detail.llmModel && isKnownChatModel(detail.llmModel) ? detail.llmModel : DEFAULT_CHAT_MODEL
		);
		setConnectorIds([...detail.connectorIds]);
		setEmails([...detail.emailAddresses].map((e) => e.trim()).filter(Boolean));
		setEmailDraft('');
		setEmailError(undefined);
		setSlackChannelId(detail.slackChannelId ?? '');
		setActionError(undefined);
	}, []);

	const clearEditor = useCallback(() => {
		setPlaybook(undefined);
		setResolvedId(undefined);
		setLoadError(undefined);
		setName('');
		setPrompt('');
		setSchedule(defaultSchedule());
		setLlmModel(DEFAULT_CHAT_MODEL);
		setConnectorIds([]);
		setEmails([]);
		setEmailDraft('');
		setEmailError(undefined);
		setSlackChannelId('');
		setActionError(undefined);
	}, []);


	const loadPlaybookById = useCallback(
		async (id: string, force = false) => {
			if (!PLAYBOOK_UUID_RE.test(id)) {
				setLoadError('Invalid playbook id.');
				setResolvedId(undefined);
				setPlaybook(undefined);
				return;
			}

			if (!force && id === resolvedId && playbook?.id === id) return;

			loadRequest.current?.abort();
			const request = new AbortController();
			loadRequest.current = request;
			setOpeningId(id);
			setLoadError(undefined);
			setActionError(undefined);

			try {
				const response = await fetch(`/api/playbooks/${encodeURIComponent(id)}`, {
					signal: request.signal
				});
				const payload: unknown = await response.json();
				if (request !== loadRequest.current) return;

				if (!response.ok || !isRecord(payload)) {
					throw new Error(apiErrorDetail(payload, 'Unable to load playbook.'));
				}

				const detail = parseDetail(payload.playbook);
				if (!detail) throw new Error('Unable to load playbook.');

				applyPlaybook(detail);
				void connectorsCache.load();
				void slackChannelsCache.load();
			} catch (error) {
				if (request.signal.aborted || request !== loadRequest.current) return;
				setLoadError(error instanceof Error ? error.message : 'Unable to load playbook.');
				setResolvedId(undefined);
				setPlaybook(undefined);
			} finally {
				if (request === loadRequest.current) {
					loadRequest.current = undefined;
					setOpeningId(undefined);
				}
			}
		},
		[applyPlaybook, playbook?.id, resolvedId]
	);

	useEffect(() => {
		void loadMemberOptions('/api/playbooks/members').then(setCreatorOptions);
		void connectorsCache.load();
		void slackChannelsCache.load();
	}, []);

	// Route → editor sync (SvelteKit's afterNavigate).
	useEffect(() => {
		if (routeId) {
			void loadPlaybookById(routeId);
			return;
		}
		loadRequest.current?.abort();
		loadRequest.current = undefined;
		setOpeningId(undefined);
		clearEditor();
		// eslint-disable-next-line react-hooks/exhaustive-deps -- react to route changes only
	}, [routeId]);

	function openPlaybook(id: string) {
		if (creating || openingId || deletingId || actionBusy) return;
		navigate(`/playbooks/${id}`);
	}

	async function newPlaybook() {
		if (creating || actionBusy) return;
		setCreating(true);
		setActionError(undefined);
		setMenuPlaybookId(undefined);

		try {
			const response = await fetch('/api/playbooks', { method: 'POST' });
			const payload: unknown = await response.json();

			if (!response.ok || !isRecord(payload)) {
				throw new Error(apiErrorDetail(payload, 'Unable to create playbook.'));
			}

			const created = parseListItem(payload.playbook);
			if (!created) throw new Error('Unable to create playbook.');

			setPlaybooks((current: PlaybookListItem[]) => [
				created,
				...current.filter((p) => p.id !== created.id)
			]);
			navigate(`/playbooks/${created.id}`);
			toast.success('Playbook created');
		} catch (error) {
			const detail = error instanceof Error ? error.message : 'Unable to create playbook.';
			setActionError(detail);
			toast.error("Couldn't create playbook", { description: detail });
		} finally {
			setCreating(false);
		}
	}

	function retryLoad() {
		if (!routeId) return;
		setLoadError(undefined);
		setResolvedId(undefined);
		setPlaybook(undefined);
		void loadPlaybookById(routeId, true);
	}

	function toggleMenu(id: string, event: React.MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (deletingId || openingId || creating || actionBusy) return;
		setMenuPlaybookId((current) => (current === id ? undefined : id));
	}

	function toggleConnector(id: number) {
		setConnectorIds((current) =>
			current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
		);
	}

	/** Commit the in-progress email chip; returns the resulting list. */
	function commitEmail(): string[] {
		const value = emailDraft.trim().replace(/,$/, '').trim();
		if (!value) {
			setEmailDraft('');
			return emails;
		}
		if (!EMAIL_RE.test(value)) {
			setEmailError(`“${value}” is not a valid email address.`);
			return emails;
		}
		if (emails.some((e) => e.toLowerCase() === value.toLowerCase())) {
			setEmailDraft('');
			setEmailError(undefined);
			return emails;
		}
		const next = [...emails, value];
		setEmails(next);
		setEmailDraft('');
		setEmailError(undefined);
		return next;
	}

	function removeEmail(target: string) {
		setEmails((current) => current.filter((email) => email !== target));
		setEmailError(undefined);
	}

	function onEmailKeydown(event: React.KeyboardEvent<HTMLInputElement>) {
		if (event.key === 'Enter' || event.key === ',' || event.key === ' ') {
			event.preventDefault();
			commitEmail();
			return;
		}
		if (event.key === 'Backspace' && emailDraft === '' && emails.length > 0) {
			setEmails((current) => current.slice(0, -1));
		}
	}

	const persistPlaybook = useCallback(
		async (emailList: string[]): Promise<{ ok: boolean; error?: string }> => {
			const id = playbook?.id ?? routeId;
			if (!id || saving) return { ok: false };
			setSaving(true);
			setActionError(undefined);

			try {
				const response = await fetch(`/api/playbooks/${encodeURIComponent(id)}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						name: name.trim() || 'Untitled playbook',
						prompt,
						cronString: cronString.trim(),
						llmModel,
						connectorIds: [...connectorIds],
						emailAddresses: [...emailList],
						slackChannelId: slackChannelId.trim() || null
					})
				});
				const payload: unknown = await response.json();
				if (!response.ok || !isRecord(payload)) {
					throw new Error(apiErrorDetail(payload, 'Unable to save playbook.'));
				}
				const detail = parseDetail(payload.playbook);
				if (!detail) throw new Error('Unable to save playbook.');
				applyPlaybook(detail);
				setPlaybooks((current) =>
					current.map((item) =>
						item.id === detail.id
							? {
									...item,
									name: detail.name,
									status: detail.status,
									cronString: detail.cronString || null,
									updatedAt: detail.updatedAt,
									isRunning: detail.isRunning
								}
							: item
					)
				);
				return { ok: true };
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Unable to save playbook.';
				setActionError(message);
				return { ok: false, error: message };
			} finally {
				setSaving(false);
			}
		},
		[
			applyPlaybook,
			connectorIds,
			cronString,
			llmModel,
			name,
			playbook?.id,
			prompt,
			routeId,
			saving,
			slackChannelId
		]
	);

	const savePlaybook = useCallback(async () => {
		if (actionBusy && !saving) return;
		const result = await persistPlaybook(commitEmail());
		if (result.ok) {
			toast.success('Playbook saved');
		} else if (result.error) {
			toast.error("Couldn't save playbook", { description: result.error });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- commitEmail closes over current draft state
	}, [actionBusy, persistPlaybook, saving, emailDraft, emails]);

	useEffect(() => {
		function onWindowKeydown(event: KeyboardEvent) {
			if (event.key === 'Escape' && menuPlaybookId !== undefined) setMenuPlaybookId(undefined);
			if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
				event.preventDefault();
				if (showEditor && isDirty && !actionBusy) void savePlaybook();
			}
		}
		function onWindowPointerDown(event: PointerEvent) {
			if (menuPlaybookId === undefined) return;
			const target = event.target;
			if (!(target instanceof Element) || !target.closest('[data-playbook-menu]')) {
				setMenuPlaybookId(undefined);
			}
		}
		window.addEventListener('keydown', onWindowKeydown);
		window.addEventListener('pointerdown', onWindowPointerDown);
		return () => {
			window.removeEventListener('keydown', onWindowKeydown);
			window.removeEventListener('pointerdown', onWindowPointerDown);
		};
	}, [menuPlaybookId, showEditor, isDirty, actionBusy, savePlaybook]);

	async function deployPlaybook() {
		const id = playbook?.id ?? routeId;
		if (!id || actionBusy) return;
		setDeploying(true);
		setActionError(undefined);

		try {
			if (isDirty) {
				const result = await persistPlaybook(emails);
				if (!result.ok) {
					if (result.error) {
						toast.error("Couldn't deploy playbook", {
							description: result.error
						});
					}
					return;
				}
			}

			const response = await fetch(`/api/playbooks/${encodeURIComponent(id)}/deploy`, {
				method: 'POST'
			});
			const payload: unknown = await response.json();
			if (!response.ok || !isRecord(payload)) {
				throw new Error(apiErrorDetail(payload, 'Unable to deploy playbook.'));
			}
			await loadPlaybookById(id, true);
			void list.load();
			toast.success('Playbook deployed');
		} catch (error) {
			const detail = error instanceof Error ? error.message : 'Unable to deploy playbook.';
			setActionError(detail);
			toast.error("Couldn't deploy playbook", { description: detail });
		} finally {
			setDeploying(false);
		}
	}

	async function deactivatePlaybook() {
		const id = playbook?.id ?? routeId;
		if (!id || actionBusy) return;

		const confirmed = await confirm({
			tone: 'warning',
			title: 'Deactivate playbook?',
			description:
				'This stops the playbook from running on its schedule until you deploy it again.',
			confirmLabel: 'Deactivate'
		});
		if (!confirmed) return;

		setDeactivating(true);
		setActionError(undefined);

		try {
			const response = await fetch(`/api/playbooks/${encodeURIComponent(id)}/deactivate`, {
				method: 'POST'
			});
			const payload: unknown = await response.json();
			if (!response.ok || !isRecord(payload)) {
				throw new Error(apiErrorDetail(payload, 'Unable to deactivate playbook.'));
			}
			await loadPlaybookById(id, true);
			void list.load();
			toast.success('Playbook deactivated');
		} catch (error) {
			const detail = error instanceof Error ? error.message : 'Unable to deactivate playbook.';
			setActionError(detail);
			toast.error("Couldn't deactivate playbook", { description: detail });
		} finally {
			setDeactivating(false);
		}
	}

	async function deletePlaybook(id: string, event?: React.MouseEvent) {
		event?.stopPropagation();
		event?.preventDefault();
		setMenuPlaybookId(undefined);
		if (deletingId || openingId || creating || actionBusy) return;

		const confirmed = await confirm({
			tone: 'danger',
			title: 'Delete playbook?',
			description: 'This permanently deletes the playbook and its schedule. This cannot be undone.',
			confirmLabel: 'Delete'
		});
		if (!confirmed) return;

		setDeletingId(id);
		const rollback = list.remove(id);

		try {
			const response = await fetch(`/api/playbooks/${encodeURIComponent(id)}`, {
				method: 'DELETE'
			});
			if (!response.ok) throw new Error('Unable to delete playbook.');

			if (routeId === id || playbook?.id === id) {
				clearEditor();
				navigate('/playbooks');
			}
			toast.success('Playbook deleted');
		} catch {
			rollback();
			setActionError('Unable to delete playbook.');
			toast.error("Couldn't delete playbook", {
				description: 'Something went wrong. Please try again.'
			});
		} finally {
			setDeletingId(undefined);
		}
	}

	const actions = showList ? (
		<button
			type="button"
			className={NEW_BTN}
			disabled={creating || actionBusy}
			onClick={newPlaybook}
		>
			{creating ? <UnicodeSpinner label="Creating playbook" /> : <Plus size={15} strokeWidth={2} />}
			<span>New playbook</span>
		</button>
	) : (
		<>
			<Link
				className="inline-flex cursor-pointer text-[12.5px] font-medium text-muted no-underline hover:text-ink"
				to="/playbooks"
			>
				All playbooks
			</Link>
			{showEditor && playbook && (
				<>
					{(isDirty || saving) && (
						<button
							type="button"
							className={cx(ACTION_BTN, ACTION_BTN_NEUTRAL)}
							disabled={actionBusy}
							onClick={savePlaybook}
						>
							{saving && <UnicodeSpinner label="Saving" />}
							<span>{saving ? 'Saving…' : 'Save'}</span>
						</button>
					)}
					{playbook.status === 'STATUS_ACTIVE' ? (
						<button
							type="button"
							className={cx(ACTION_BTN, ACTION_BTN_NEUTRAL)}
							disabled={actionBusy}
							onClick={deactivatePlaybook}
						>
							{deactivating && <UnicodeSpinner label="Deactivating" />}
							<span>{deactivating ? 'Deactivating…' : 'Deactivate'}</span>
						</button>
					) : (
						<button
							type="button"
							className={cx(
								ACTION_BTN,
								'bg-ink text-white shadow-none hover:not-disabled:bg-[color-mix(in_srgb,var(--color-ink)_88%,var(--color-elevate))]'
							)}
							disabled={actionBusy}
							onClick={deployPlaybook}
						>
							{deploying && <UnicodeSpinner label="Deploying" />}
							<span>{deploying ? 'Deploying…' : 'Deploy'}</span>
						</button>
					)}
					<button
						type="button"
						className={cx(
							ACTION_BTN,
							'bg-elevate/70 text-[#b91c1c] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_75%,transparent)] hover:not-disabled:bg-elevate/92'
						)}
						disabled={actionBusy}
						onClick={() => {
							const id = playbook?.id;
							if (id) void deletePlaybook(id);
						}}
					>
						Delete
					</button>
				</>
			)}
		</>
	);

	return (
		<Page title={pageTitle} lead={pageLead} wide actions={actions}>
			{showList ? (
				<>
				<FilterToolbar
					fields={fields}
					placeholder="Search playbooks…"
					searching={list.searching}
					search={list.search}
					onSearchChange={list.setSearch}
					filters={list.filters}
					onFiltersChange={list.setFilters}
					sortEntries={list.sortEntries}
					onSortChange={list.setSortEntries}
				/>

				<section className={LIST_SECTION_SCROLL} aria-label="Playbook list">
					{actionError && (
						<p className="mx-0 mt-0 mb-1 text-[12.5px] text-[#b91c1c]">{actionError}</p>
					)}

					{list.loading ? (
						<div className={STATE_BLOCK} aria-busy="true">
							<UnicodeSpinner label="Loading playbooks" />
							<p className={STATE_TEXT}>Loading playbooks…</p>
						</div>
					) : list.error ? (
						<div className={STATE_BLOCK}>
							<p className={STATE_TEXT}>Unable to load playbooks.</p>
							<button type="button" className={RETRY_BTN} onClick={() => void list.load()}>
								Retry
							</button>
						</div>
					) : list.items.length === 0 ? (
						<div className={STATE_BLOCK}>
							<p className={STATE_TITLE}>
								{list.narrowed ? 'No matching playbooks' : 'No playbooks yet'}
							</p>
							<p className={STATE_TEXT}>
								{list.narrowed
									? 'Try clearing a filter or searching for something else.'
									: 'Create one to schedule a recurring agent run.'}
							</p>
							{list.narrowed && (
								<button type="button" className={RETRY_BTN} onClick={list.clearFilters}>
									Clear filters
								</button>
							)}
						</div>
					) : (
						<div className={BOARD}>
							{boardGroups.map((group) => {
								// Live rows get the roomier "featured" treatment; paused rows dim their name.
								const featured = group.key === 'active';
								const dimmed = group.key === 'inactive';
								return (
									<section key={group.key} className={BOARD_GROUP} aria-label={group.title}>
										<header className={BOARD_GROUP_HEAD}>
											<div className={BOARD_GROUP_TITLE_ROW}>
												<h2 className={BOARD_GROUP_TITLE}>{group.title}</h2>
												<span className={BOARD_GROUP_COUNT}>{group.items.length}</span>
											</div>
											<p className={BOARD_GROUP_HINT}>{group.hint}</p>
										</header>

										<ul
											className={cx(
												'm-0 flex list-none flex-col p-0',
												featured ? 'gap-1' : 'gap-0.5'
											)}
										>
											{group.items.map((item) => {
												const tone = statusTone(item.status);
												return (
													<li
														key={item.id}
														className={cx(
															'group/row flex items-center gap-0.5 rounded-sm transition-[background] duration-[120ms]',
															featured
																? 'bg-[color-mix(in_srgb,var(--color-paper)_88%,var(--color-elevate))] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_70%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-elevate)_82%,var(--color-paper))]'
																: 'hover:bg-elevate/70',
															(item.id === openingId || item.id === deletingId) && 'opacity-65'
														)}
													>
														<button
															type="button"
															className={cx(
																'grid min-w-0 flex-1 cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-sm border-0 bg-transparent text-left text-inherit no-underline max-[560px]:grid-cols-[auto_minmax(0,1fr)] max-[560px]:gap-y-1.5 disabled:cursor-wait disabled:opacity-70',
																featured
																	? 'pt-3.5 pr-2 pb-3.5 pl-3.5 max-[560px]:pt-3 max-[560px]:pr-1.5 max-[560px]:pb-3 max-[560px]:pl-3'
																	: 'pt-2.5 pr-1.5 pb-2.5 pl-2.5 max-[560px]:pr-1'
															)}
															title={item.name}
															disabled={
																creating ||
																openingId !== undefined ||
																deletingId !== undefined ||
																actionBusy
															}
															onClick={() => openPlaybook(item.id)}
														>
															<span
																className={cx(
																	'relative size-[7px] shrink-0 rounded-full',
																	STATUS_DOT[tone] ?? 'bg-[#d6d3d1]',
																	item.isRunning &&
																		"after:absolute after:-inset-[3px] after:animate-status-ping after:rounded-full after:bg-[color-mix(in_srgb,#4ade80_45%,transparent)] after:content-[''] motion-reduce:after:hidden motion-reduce:after:animate-none"
																)}
																aria-hidden="true"
															/>

															<span className="flex min-w-0 flex-col gap-0.5">
																<span className="flex min-w-0 items-center gap-2">
																	<span
																		className={cx(
																			'min-w-0 overflow-hidden font-sans text-ellipsis whitespace-nowrap',
																			featured
																				? 'text-[14.5px] font-semibold'
																				: 'text-[13px] font-medium',
																			dimmed
																				? 'text-[color-mix(in_srgb,var(--color-ink)_72%,var(--color-muted))]'
																				: 'text-ink'
																		)}
																	>
																		{item.name}
																	</span>
																	{item.isRunning && (
																		<span className="shrink-0 text-[10.5px] font-semibold tracking-[0.02em] text-[#166534] uppercase">
																			Running
																		</span>
																	)}
																</span>
																<span className="flex min-w-0 items-center gap-2.5">
																	<span
																		className={cx(
																			ROW_META,
																			featured ? 'text-[12px]' : 'text-[11.5px]',
																			!item.cronString && 'opacity-85'
																		)}
																		title={item.cronString ?? undefined}
																	>
																		{formatCron(item.cronString)}
																	</span>
																	{item.ownerName && (
																		<span
																			className={cx(
																				ROW_META,
																				featured ? 'text-[12px]' : 'text-[11.5px]'
																			)}
																			title={item.ownerName}
																		>
																			{item.ownerName}
																		</span>
																	)}
																</span>
															</span>

															<span className="flex shrink-0 items-center gap-2 self-start pt-0.5 max-[560px]:col-start-2 max-[560px]:justify-start max-[560px]:pt-0">
																<span className="shrink-0 text-[11.5px] text-muted">
																	{formatUpdated(item.updatedAt)}
																</span>
																{item.id === openingId && (
																	<UnicodeSpinner
																		className={ROW_SPINNER}
																		label="Opening playbook"
																	/>
																)}
															</span>
														</button>

														<div className={MENU_WRAP} data-playbook-menu>
															<button
																type="button"
																className={cx(
																	MENU_BTN_BASE,
																	menuPlaybookId === item.id || item.id === deletingId
																		? MENU_BTN_SHOWN
																		: MENU_BTN_HIDDEN
																)}
																aria-label="Playbook options"
																aria-haspopup="menu"
																aria-expanded={menuPlaybookId === item.id}
																title="Playbook options"
																disabled={deletingId !== undefined || creating || actionBusy}
																onClick={(event) => toggleMenu(item.id, event)}
															>
																{item.id === deletingId ? (
																	<UnicodeSpinner
																		className={ROW_SPINNER}
																		label="Deleting playbook"
																	/>
																) : (
																	<Ellipsis size={13} strokeWidth={2} />
																)}
															</button>
															{menuPlaybookId === item.id && (
																<div className={MENU_POPOVER} role="menu">
																	<button
																		type="button"
																		className={MENU_ITEM}
																		role="menuitem"
																		onClick={(event) => deletePlaybook(item.id, event)}
																	>
																		Delete
																	</button>
																</div>
															)}
														</div>
													</li>
												);
											})}
										</ul>
									</section>
								);
							})}

							{list.hasMore || list.loadingMore ? (
								<div className={BOARD_MORE} ref={list.sentinelRef}>
									{list.moreError ? (
										<>
											<p className={STATE_TEXT}>Couldn't load more playbooks.</p>
											<button type="button" className={RETRY_BTN} onClick={list.loadMore}>
												Retry
											</button>
										</>
									) : list.loadingMore ? (
										<UnicodeSpinner label="Loading more playbooks" />
									) : (
										<button type="button" className={RETRY_BTN} onClick={list.loadMore}>
											Load more
										</button>
									)}
								</div>
							) : (
								<p className={BOARD_END}>
									{list.items.length} of {list.totalCount} playbooks
								</p>
							)}
						</div>
					)}
				</section>
				</>
			) : showLoading ? (
				<section className={STATE_BLOCK} aria-label="Loading playbook" aria-busy="true">
					<UnicodeSpinner label="Loading playbook" />
					<p className={STATE_TEXT}>Loading playbook…</p>
				</section>
			) : showError ? (
				<section className={STATE_BLOCK} aria-label="Playbook load error">
					<p className={STATE_TEXT}>{loadError}</p>
					<div className="flex flex-wrap justify-center gap-1">
						<button type="button" className={RETRY_BTN} onClick={retryLoad}>
							Retry
						</button>
						<Link
							className={cx(RETRY_BTN, 'inline-flex items-center no-underline')}
							to="/playbooks"
						>
							All playbooks
						</Link>
					</div>
				</section>
			) : showEditor && playbook ? (
				<section className="flex min-h-0 flex-1 flex-col gap-1" aria-label="Playbook editor">
					{actionError && (
						<p className="mx-0 mt-0 mb-1 text-[12.5px] text-[#b91c1c]">{actionError}</p>
					)}

					<form
						className="grid w-full min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] grid-rows-[minmax(0,1fr)] items-stretch gap-6 max-[720px]:grid-cols-[minmax(0,1fr)] max-[720px]:grid-rows-none max-[720px]:flex-none"
						onSubmit={(event) => {
							event.preventDefault();
							void savePlaybook();
						}}
					>
						{/* Each pane scrolls independently so a tall config column doesn't get
						    clipped by the fixed-height editor grid. */}
						<div className="flex min-h-0 min-w-0 flex-col gap-3.5 overflow-y-auto">
							<label className={FIELD}>
								<span className={FIELD_LABEL}>Name</span>
								<input
									className={cx(FIELD_INPUT, 'w-full leading-[1.4]')}
									type="text"
									value={name}
									onChange={(event) => setName(event.target.value)}
									disabled={actionBusy}
									placeholder="Untitled playbook"
								/>
							</label>

							<fieldset className={FIELD_WIDE} disabled={actionBusy}>
								<span className={FIELD_LABEL}>Schedule</span>
								<div className="flex flex-wrap items-center gap-2">
									<div className="w-[150px] flex-none">
										<Select
											value={schedule.frequency}
											options={frequencyOptions}
											onValueChange={(frequency) =>
												setSchedule((current) => ({ ...current, frequency }))
											}
											disabled={actionBusy}
											aria-label="Schedule frequency"
										/>
									</div>

									{schedule.frequency === 'hourly' ? (
										<div className="m-0 inline-flex items-center gap-1.5">
											<span className="text-[12px] text-muted">at minute</span>
											<div className="w-[78px]">
												<Select
													value={schedule.minute}
													options={minuteOptions}
													onValueChange={setMinute}
													disabled={actionBusy}
													searchable
													searchPlaceholder="Minute"
													aria-label="Minute"
												/>
											</div>
										</div>
									) : schedule.frequency === 'custom' ? (
										<input
											className={cx(FIELD_INPUT, 'w-auto flex-[1_1_160px] font-mono leading-[1.4]')}
											type="text"
											value={schedule.raw}
											onChange={(event) =>
												setSchedule((current) => ({
													...current,
													raw: event.target.value
												}))
											}
											placeholder="0 9 * * *"
											spellCheck={false}
										/>
									) : (
										<>
											{schedule.frequency === 'weekly' && (
												<div className="w-[150px] flex-none">
													<Select
														value={schedule.dayOfWeek}
														options={weekdayOptions}
														onValueChange={(dayOfWeek) =>
															setSchedule((current) => ({
																...current,
																dayOfWeek
															}))
														}
														disabled={actionBusy}
														aria-label="Day of week"
													/>
												</div>
											)}
											{schedule.frequency === 'monthly' && (
												<div className="w-[120px] flex-none">
													<Select
														value={schedule.dayOfMonth}
														options={dayOfMonthOptions}
														onValueChange={(dayOfMonth) =>
															setSchedule((current) => ({
																...current,
																dayOfMonth
															}))
														}
														disabled={actionBusy}
														aria-label="Day of month"
													/>
												</div>
											)}
											<div className="m-0 inline-flex items-center gap-1.5">
												<span className="text-[12px] text-muted">at</span>
												<div className="inline-flex items-center gap-1">
													<div className="w-[68px]">
														<Select
															value={hour12}
															options={hourOptions}
															onValueChange={setHour12}
															disabled={actionBusy}
															aria-label="Hour"
														/>
													</div>
													<span className="font-semibold text-muted">:</span>
													<div className="w-[68px]">
														<Select
															value={schedule.minute}
															options={minuteOptions}
															onValueChange={setMinute}
															disabled={actionBusy}
															searchable
															searchPlaceholder="Minute"
															aria-label="Minute"
														/>
													</div>
													<div className="w-[72px]">
														<Select
															value={period}
															options={periodOptions}
															onValueChange={setPeriod}
															disabled={actionBusy}
															aria-label="AM or PM"
														/>
													</div>
												</div>
											</div>
										</>
									)}
								</div>
								<p className="m-0 text-[12px] leading-[1.4] text-muted">{schedulePreview}</p>
							</fieldset>

							<div className={FIELD}>
								<span className={FIELD_LABEL}>Model</span>
								<Select
									value={llmModel}
									options={modelOptions}
									onValueChange={setLlmModel}
									disabled={actionBusy}
									aria-label="Model"
								/>
							</div>

							<fieldset className={FIELD_WIDE} disabled={actionBusy}>
								<span className={FIELD_LABEL}>Connectors</span>
								{connectors.loading && !connectors.loaded ? (
									<div className="flex min-h-[1.5em] items-center">
										<UnicodeSpinner label="Loading connectors" />
									</div>
								) : connectors.error ? (
									<button
										type="button"
										className={RETRY_BTN_INLINE}
										onClick={() => connectorsCache.load(true)}
									>
										Retry connectors
									</button>
								) : connectors.connectors.length === 0 ? (
									<p className={FIELD_HINT}>No connectors available.</p>
								) : (
									<div className="flex max-h-[180px] flex-col gap-1 overflow-y-auto rounded-sm border border-line/85 bg-elevate/60 p-1.5">
										{connectors.connectors.map((connector) => (
											<label
												className="flex cursor-pointer items-center gap-2 rounded-xs px-1.5 py-[5px] text-[12.5px] hover:bg-elevate/70"
												key={connector.id}
											>
												<input
													type="checkbox"
													checked={connectorIds.includes(connector.id)}
													onChange={() => toggleConnector(connector.id)}
												/>
												<img
													className="size-4 shrink-0 rounded-[3px] object-contain"
													src={connectorIconSrc(connector.type)}
													alt=""
												/>
												<span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-ink">
													{connector.name}
												</span>
												<span className="shrink-0 text-[11px] text-muted">{connector.type}</span>
											</label>
										))}
									</div>
								)}
							</fieldset>

							<div className={FIELD}>
								<span className={FIELD_LABEL}>Email recipients</span>
								<div
									className={cx(
										'flex flex-wrap items-center gap-1.5 rounded-sm border border-line/85 bg-elevate/78 p-1.5 focus-within:border-accent/55',
										actionBusy && 'opacity-60'
									)}
								>
									{emails.map((email) => (
										<span
											className="inline-flex max-w-full items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--color-accent)_12%,var(--color-elevate))] pt-[3px] pr-1 pb-[3px] pl-2 text-[12px] leading-[1.2] shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-accent)_22%,transparent)]"
											key={email}
										>
											<span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-ink">
												{email}
											</span>
											<button
												type="button"
												className="inline-flex size-4 cursor-pointer items-center justify-center rounded-full border-0 bg-transparent p-0 text-ink/55 hover:not-disabled:bg-ink/10 hover:not-disabled:text-ink"
												aria-label={`Remove ${email}`}
												disabled={actionBusy}
												onClick={() => removeEmail(email)}
											>
												<X size={12} strokeWidth={2.25} />
											</button>
										</span>
									))}
									<input
										className="min-w-[120px] flex-[1_1_120px] border-0 bg-transparent px-0.5 py-1 text-[13px] text-ink focus:outline-none"
										type="text"
										inputMode="email"
										autoComplete="off"
										spellCheck={false}
										aria-label="Email recipients"
										value={emailDraft}
										onChange={(event) => setEmailDraft(event.target.value)}
										disabled={actionBusy}
										placeholder={emails.length ? 'Add another…' : 'name@company.com'}
										onKeyDown={onEmailKeydown}
										onBlur={() => commitEmail()}
									/>
								</div>
								{emailError ? (
									<p className="m-0 text-[12px] text-[#b91c1c]">{emailError}</p>
								) : (
									<p className={FIELD_HINT}>
										Press Enter or comma to add. Reports are sent to each recipient.
									</p>
								)}
							</div>

							<div className={FIELD}>
								<span className={FIELD_LABEL}>
									<img
										className="size-[14px] rounded-[3px] object-contain"
										src={connectorIconSrc('SLACK')}
										alt=""
									/>
									Slack channel
								</span>
								{slack.loading && !slack.loaded ? (
									<div className="flex min-h-[1.5em] items-center">
										<UnicodeSpinner label="Loading Slack channels" />
									</div>
								) : slack.error ? (
									<button
										type="button"
										className={RETRY_BTN_INLINE}
										onClick={() => slackChannelsCache.load(true)}
									>
										Retry Slack channels
									</button>
								) : slack.channels.length === 0 ? (
									<p className={FIELD_HINT}>No Slack channels connected.</p>
								) : (
									<Select
										value={slackChannelId}
										options={slackOptions}
										onValueChange={setSlackChannelId}
										disabled={actionBusy}
										searchable
										searchPlaceholder="Search channels…"
										aria-label="Slack channel"
										leading={<Hash size={14} strokeWidth={2} />}
									/>
								)}
							</div>
						</div>

						{/* The prompt pane manages its own scroll (textarea / preview). */}
						<div className="flex min-h-0 min-w-0 flex-col gap-3.5 overflow-y-visible">
							<div className={cx(FIELD, 'min-h-0 flex-1')}>
								<div className="flex items-center justify-between gap-2">
									<span className={FIELD_LABEL}>Prompt</span>
									<div
										className="inline-flex rounded-[8px] border border-line/85 bg-ink/3 p-0.5"
										role="tablist"
										aria-label="Prompt view"
									>
										<button
											type="button"
											className={cx(
												SEG_BTN,
												promptView === 'write'
													? 'bg-elevate/92 text-ink shadow-[0_1px_2px_color-mix(in_srgb,var(--color-ink)_12%,transparent)]'
													: 'bg-transparent text-muted'
											)}
											role="tab"
											aria-selected={promptView === 'write'}
											onClick={() => promptViewPref.setMode('write')}
										>
											<Pencil size={13} />
											<span>Write</span>
										</button>
										<button
											type="button"
											className={cx(
												SEG_BTN,
												promptView === 'preview'
													? 'bg-elevate/92 text-ink shadow-[0_1px_2px_color-mix(in_srgb,var(--color-ink)_12%,transparent)]'
													: 'bg-transparent text-muted'
											)}
											role="tab"
											aria-selected={promptView === 'preview'}
											onClick={() => promptViewPref.setMode('preview')}
										>
											<Eye size={14} />
											<span>Preview</span>
										</button>
									</div>
								</div>
								{promptView === 'write' ? (
									<textarea
										className={cx(
											FIELD_INPUT,
											'h-full min-h-[160px] w-full flex-1 resize-none leading-[1.55] max-[720px]:min-h-[240px] max-[720px]:resize-y'
										)}
										value={prompt}
										onChange={(event) => setPrompt(event.target.value)}
										disabled={actionBusy}
										rows={8}
										placeholder="What should this playbook do?"
									/>
								) : (
									// Markdown preview mirrors the textarea box so toggling is seamless.
									<div
										className={cx(
											FIELD_INPUT,
											'min-h-[160px] w-full flex-1 overflow-y-auto leading-[1.4] max-[720px]:min-h-[240px]'
										)}
									>
										{prompt.trim() ? (
											<Markdown content={prompt} />
										) : (
											<p className="m-0 text-[13px] text-muted italic">Nothing to preview yet.</p>
										)}
									</div>
								)}
							</div>
						</div>
					</form>
				</section>
			) : null}
		</Page>
	);
}
