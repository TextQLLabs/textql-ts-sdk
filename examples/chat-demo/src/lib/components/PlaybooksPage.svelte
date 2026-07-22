<script lang="ts">
	import Ellipsis from "@lucide/svelte/icons/ellipsis";
	import Plus from "@lucide/svelte/icons/plus";
	import { onMount } from "svelte";
	import { afterNavigate, goto } from "$app/navigation";
	import { resolve } from "$app/paths";
	import { page } from "$app/state";
	import {
		CHAT_MODELS,
		DEFAULT_CHAT_MODEL,
		isKnownChatModel,
	} from "$lib/chatModels";
	import UnicodeSpinner from "$lib/components/UnicodeSpinner.svelte";
	import { connectorsCache } from "$lib/connectorsCache.svelte";
	import { Page } from "$lib/primitives";
	import { isRecord } from "$lib/utils";

	type PlaybookListItem = {
		id: string;
		name: string;
		status: string;
		cronString: string | null;
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

	let playbooks = $state<PlaybookListItem[]>([]);
	let playbooksLoading = $state(true);
	let playbooksError = $state(false);
	let creating = $state(false);
	let menuPlaybookId = $state<string | undefined>();
	let deletingId = $state<string | undefined>();
	let openingId = $state<string | undefined>();

	let playbook = $state.raw<PlaybookDetail | undefined>();
	let resolvedId = $state<string | undefined>();
	let loadError = $state<string | undefined>();
	let loadRequest: AbortController | undefined;

	let name = $state("");
	let prompt = $state("");
	let cronString = $state("");
	let llmModel = $state<string>(DEFAULT_CHAT_MODEL);
	let connectorIds = $state<number[]>([]);
	let emailsText = $state("");
	let slackChannelId = $state("");

	let saving = $state(false);
	let deploying = $state(false);
	let deactivating = $state(false);
	let actionError = $state<string | undefined>();

	function isPlaybookUuid(value: string) {
		return PLAYBOOK_UUID_RE.test(value);
	}

	const routeId = $derived.by(() => {
		if (page.url.pathname === "/playbooks") return undefined;
		if (!page.url.pathname.startsWith("/playbooks/")) return undefined;
		return typeof page.params.id === "string" ? page.params.id : undefined;
	});
	const actionBusy = $derived(
		saving || deploying || deactivating || deletingId !== undefined,
	);
	const showLoading = $derived.by(() => {
		const id = routeId;
		if (!id) return false;
		if (loadError && resolvedId !== id) return false;
		if (resolvedId === id && playbook) return false;
		return true;
	});
	const showError = $derived(
		Boolean(
			routeId && loadError && resolvedId !== routeId && !showLoading,
		),
	);
	const showList = $derived(!routeId);
	const showEditor = $derived(
		Boolean(routeId && playbook && resolvedId === routeId && !showLoading),
	);
	const pageTitle = $derived(
		showList
			? "Playbooks"
			: name.trim() || playbook?.name || "Playbook",
	);

	const isDirty = $derived.by(() => {
		if (!playbook) return false;
		const savedEmails = [...playbook.emailAddresses]
			.map((e) => e.trim())
			.filter(Boolean)
			.sort()
			.join(",");
		const draftEmails = emailsText
			.split(",")
			.map((e) => e.trim())
			.filter(Boolean)
			.sort()
			.join(",");
		const savedConnectors = [...playbook.connectorIds].sort().join(",");
		const draftConnectors = [...connectorIds].sort().join(",");
		const savedModel =
			playbook.llmModel && isKnownChatModel(playbook.llmModel)
				? playbook.llmModel
				: DEFAULT_CHAT_MODEL;
		return (
			name !== playbook.name ||
			prompt !== playbook.prompt ||
			cronString !== (playbook.cronString ?? "") ||
			llmModel !== savedModel ||
			savedConnectors !== draftConnectors ||
			savedEmails !== draftEmails ||
			slackChannelId !== (playbook.slackChannelId ?? "")
		);
	});

	const pageLead = $derived.by(() => {
		if (showList) return "Create and manage scheduled playbooks.";
		if (!playbook) return undefined;
		const parts = [statusLabel(playbook.status)];
		if (isDirty) parts.push("Unsaved");
		if (playbook.isRunning) parts.push("Running");
		return parts.join(" · ");
	});

	function statusLabel(status: string) {
		if (status === "STATUS_ACTIVE") return "Active";
		if (status === "STATUS_INACTIVE") return "Inactive";
		return "Draft";
	}

	function statusTone(status: string) {
		if (status === "STATUS_ACTIVE") return "active";
		if (status === "STATUS_INACTIVE") return "inactive";
		return "draft";
	}

	function apiErrorDetail(payload: unknown, fallback: string): string {
		if (!isRecord(payload)) return fallback;
		if (typeof payload.error === "string") return payload.error;
		if (typeof payload.message === "string") return payload.message;
		return fallback;
	}

	function formatUpdated(value: string | null) {
		if (!value) return "—";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "—";

		const today = new Date();
		const startOfToday = new Date(
			today.getFullYear(),
			today.getMonth(),
			today.getDate(),
		);
		const startOfDay = new Date(
			date.getFullYear(),
			date.getMonth(),
			date.getDate(),
		);
		const dayDiff = Math.round(
			(startOfToday.getTime() - startOfDay.getTime()) / 86_400_000,
		);

		if (dayDiff === 0) return "Today";
		if (dayDiff === 1) return "Yesterday";
		return date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year:
				date.getFullYear() !== today.getFullYear()
					? "numeric"
					: undefined,
		});
	}

	type BoardGroup = {
		key: "active" | "draft" | "inactive";
		title: string;
		hint: string;
		items: PlaybookListItem[];
	};

	const boardGroups = $derived.by((): BoardGroup[] => {
		const active: PlaybookListItem[] = [];
		const draft: PlaybookListItem[] = [];
		const inactive: PlaybookListItem[] = [];
		for (const item of playbooks) {
			const tone = statusTone(item.status);
			if (tone === "active") active.push(item);
			else if (tone === "inactive") inactive.push(item);
			else draft.push(item);
		}
		const groups: BoardGroup[] = [];
		if (active.length) {
			groups.push({
				key: "active",
				title: "Live",
				hint: "Currently deployed",
				items: active,
			});
		}
		if (draft.length) {
			groups.push({
				key: "draft",
				title: "Drafts",
				hint: "Not deployed yet",
				items: draft,
			});
		}
		if (inactive.length) {
			groups.push({
				key: "inactive",
				title: "Paused",
				hint: "Deactivated — won’t run",
				items: inactive,
			});
		}
		return groups;
	});

	function applyPlaybook(detail: PlaybookDetail) {
		playbook = detail;
		resolvedId = detail.id;
		name = detail.name;
		prompt = detail.prompt;
		cronString = detail.cronString ?? "";
		llmModel =
			detail.llmModel && isKnownChatModel(detail.llmModel)
				? detail.llmModel
				: DEFAULT_CHAT_MODEL;
		connectorIds = [...detail.connectorIds];
		emailsText = detail.emailAddresses.join(", ");
		slackChannelId = detail.slackChannelId ?? "";
		actionError = undefined;
	}

	function clearEditor() {
		playbook = undefined;
		resolvedId = undefined;
		loadError = undefined;
		name = "";
		prompt = "";
		cronString = "";
		llmModel = DEFAULT_CHAT_MODEL;
		connectorIds = [];
		emailsText = "";
		slackChannelId = "";
		actionError = undefined;
	}

	function parseListItem(item: unknown): PlaybookListItem | null {
		if (
			!isRecord(item) ||
			typeof item.id !== "string" ||
			typeof item.name !== "string" ||
			typeof item.status !== "string"
		) {
			return null;
		}
		return {
			id: item.id,
			name: item.name,
			status: item.status,
			cronString:
				typeof item.cronString === "string" ? item.cronString : null,
			updatedAt:
				typeof item.updatedAt === "string" || item.updatedAt === null
					? item.updatedAt
					: null,
			isRunning: item.isRunning === true,
		};
	}

	function parseDetail(item: unknown): PlaybookDetail | null {
		if (
			!isRecord(item) ||
			typeof item.id !== "string" ||
			typeof item.name !== "string"
		) {
			return null;
		}
		return {
			id: item.id,
			name: item.name,
			prompt: typeof item.prompt === "string" ? item.prompt : "",
			status:
				typeof item.status === "string"
					? item.status
					: "STATUS_UNKNOWN",
			triggerType:
				typeof item.triggerType === "string"
					? item.triggerType
					: "TRIGGER_TYPE_UNKNOWN",
			cronString:
				typeof item.cronString === "string" ? item.cronString : "",
			llmModel: typeof item.llmModel === "string" ? item.llmModel : null,
			connectorIds: Array.isArray(item.connectorIds)
				? item.connectorIds.filter(
						(id): id is number =>
							typeof id === "number" && Number.isInteger(id),
					)
				: [],
			emailAddresses: Array.isArray(item.emailAddresses)
				? item.emailAddresses.filter(
						(email): email is string => typeof email === "string",
					)
				: [],
			slackChannelId:
				typeof item.slackChannelId === "string"
					? item.slackChannelId
					: null,
			isRunning: item.isRunning === true,
			updatedAt:
				typeof item.updatedAt === "string" || item.updatedAt === null
					? item.updatedAt
					: null,
			createdAt:
				typeof item.createdAt === "string" || item.createdAt === null
					? item.createdAt
					: null,
		};
	}

	async function loadPlaybooks() {
		playbooksLoading = true;
		playbooksError = false;

		try {
			const response = await fetch("/api/playbooks");
			const payload: unknown = await response.json();

			if (
				!response.ok ||
				!isRecord(payload) ||
				!Array.isArray(payload.playbooks)
			) {
				throw new Error("Unable to load playbooks.");
			}

			playbooks = payload.playbooks
				.map(parseListItem)
				.filter((item): item is PlaybookListItem => item !== null);
		} catch {
			playbooksError = true;
		} finally {
			playbooksLoading = false;
		}
	}

	async function setPlaybookRoute(id: string | undefined, replace = false) {
		if (id) {
			if (
				page.url.pathname.startsWith("/playbooks/") &&
				page.params.id === id
			) {
				return;
			}
			await goto(resolve("/(chat)/playbooks/[id]", { id }), {
				replaceState: replace,
				noScroll: true,
				keepFocus: true,
			});
			return;
		}

		if (page.url.pathname === "/playbooks") return;
		await goto(resolve("/(chat)/playbooks"), {
			replaceState: replace,
			noScroll: true,
			keepFocus: true,
		});
	}

	async function loadPlaybookById(id: string, force = false) {
		if (openingId === id) return;

		if (!isPlaybookUuid(id)) {
			loadError = "Invalid playbook id.";
			resolvedId = undefined;
			playbook = undefined;
			return;
		}

		if (!force && id === resolvedId && playbook?.id === id) {
			return;
		}

		loadRequest?.abort();
		const request = new AbortController();
		loadRequest = request;
		openingId = id;
		loadError = undefined;
		actionError = undefined;

		try {
			const response = await fetch(
				`/api/playbooks/${encodeURIComponent(id)}`,
				{ signal: request.signal },
			);
			const payload: unknown = await response.json();
			if (request !== loadRequest || page.params.id !== id) return;

			if (!response.ok || !isRecord(payload)) {
				throw new Error(
					apiErrorDetail(payload, "Unable to load playbook."),
				);
			}

			const detail = parseDetail(payload.playbook);
			if (!detail) {
				throw new Error("Unable to load playbook.");
			}

			applyPlaybook(detail);
			void connectorsCache.load();
		} catch (error) {
			if (request.signal.aborted || request !== loadRequest) return;
			loadError =
				error instanceof Error
					? error.message
					: "Unable to load playbook.";
			resolvedId = undefined;
			playbook = undefined;
		} finally {
			if (request === loadRequest) {
				loadRequest = undefined;
				openingId = undefined;
			}
		}
	}

	async function syncFromRoute() {
		if (!page.url.pathname.startsWith("/playbooks")) return;

		const id =
			page.url.pathname === "/playbooks"
				? undefined
				: typeof page.params.id === "string"
					? page.params.id
					: undefined;

		if (id) {
			await loadPlaybookById(id);
			return;
		}
		loadRequest?.abort();
		loadRequest = undefined;
		openingId = undefined;
		clearEditor();
	}

	function openPlaybook(id: string) {
		if (creating || openingId || deletingId || actionBusy) return;
		void setPlaybookRoute(id);
	}

	async function newPlaybook() {
		if (creating || actionBusy) return;
		creating = true;
		actionError = undefined;
		menuPlaybookId = undefined;

		try {
			const response = await fetch("/api/playbooks", { method: "POST" });
			const payload: unknown = await response.json();

			if (!response.ok || !isRecord(payload)) {
				throw new Error(
					apiErrorDetail(payload, "Unable to create playbook."),
				);
			}

			const created = parseListItem(payload.playbook);
			if (!created) {
				throw new Error("Unable to create playbook.");
			}

			playbooks = [
				created,
				...playbooks.filter((p) => p.id !== created.id),
			];
			await setPlaybookRoute(created.id);
		} catch (error) {
			actionError =
				error instanceof Error
					? error.message
					: "Unable to create playbook.";
		} finally {
			creating = false;
		}
	}

	function retryLoad() {
		const id = routeId;
		if (!id) return;
		loadError = undefined;
		resolvedId = undefined;
		playbook = undefined;
		void loadPlaybookById(id);
	}

	function toggleMenu(id: string, event: MouseEvent) {
		event.stopPropagation();
		event.preventDefault();
		if (deletingId || openingId || creating || actionBusy) return;
		menuPlaybookId = menuPlaybookId === id ? undefined : id;
	}

	function onWindowKeydown(event: KeyboardEvent) {
		if (event.key === "Escape" && menuPlaybookId !== undefined) {
			menuPlaybookId = undefined;
		}
		if (
			(event.metaKey || event.ctrlKey) &&
			event.key.toLowerCase() === "s"
		) {
			event.preventDefault();
			if (showEditor && isDirty && !actionBusy) {
				void savePlaybook();
			}
		}
	}

	function onWindowPointerDown(event: PointerEvent) {
		if (menuPlaybookId === undefined) return;
		const target = event.target;
		if (!(target instanceof Element) || !target.closest(".playbook-menu")) {
			menuPlaybookId = undefined;
		}
	}

	function toggleConnector(id: number) {
		if (connectorIds.includes(id)) {
			connectorIds = connectorIds.filter((value) => value !== id);
		} else {
			connectorIds = [...connectorIds, id];
		}
	}

	function buildSaveBody() {
		const emailAddresses = emailsText
			.split(",")
			.map((email) => email.trim())
			.filter(Boolean);
		return {
			name: name.trim() || "Untitled playbook",
			prompt,
			cronString: cronString.trim(),
			llmModel,
			connectorIds: [...connectorIds],
			emailAddresses,
			slackChannelId: slackChannelId.trim() || null,
		};
	}

	async function persistPlaybook(): Promise<boolean> {
		const id = playbook?.id ?? routeId;
		if (!id || saving) return false;
		saving = true;
		actionError = undefined;

		try {
			const response = await fetch(
				`/api/playbooks/${encodeURIComponent(id)}`,
				{
					method: "PUT",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(buildSaveBody()),
				},
			);
			const payload: unknown = await response.json();
			if (!response.ok || !isRecord(payload)) {
				throw new Error(
					apiErrorDetail(payload, "Unable to save playbook."),
				);
			}
			const detail = parseDetail(payload.playbook);
			if (!detail) throw new Error("Unable to save playbook.");
			applyPlaybook(detail);
			playbooks = playbooks.map((item) =>
				item.id === detail.id
					? {
							...item,
							name: detail.name,
							status: detail.status,
							cronString: detail.cronString || null,
							updatedAt: detail.updatedAt,
							isRunning: detail.isRunning,
						}
					: item,
			);
			return true;
		} catch (error) {
			actionError =
				error instanceof Error
					? error.message
					: "Unable to save playbook.";
			return false;
		} finally {
			saving = false;
		}
	}

	async function savePlaybook() {
		if (actionBusy && !saving) return;
		await persistPlaybook();
	}

	async function deployPlaybook() {
		const id = playbook?.id ?? routeId;
		if (!id || actionBusy) return;
		deploying = true;
		actionError = undefined;

		try {
			if (isDirty) {
				const saved = await persistPlaybook();
				if (!saved) return;
			}

			const response = await fetch(
				`/api/playbooks/${encodeURIComponent(id)}/deploy`,
				{ method: "POST" },
			);
			const payload: unknown = await response.json();
			if (!response.ok || !isRecord(payload)) {
				throw new Error(
					apiErrorDetail(payload, "Unable to deploy playbook."),
				);
			}
			await loadPlaybookById(id, true);
			void loadPlaybooks();
		} catch (error) {
			actionError =
				error instanceof Error
					? error.message
					: "Unable to deploy playbook.";
		} finally {
			deploying = false;
		}
	}

	async function deactivatePlaybook() {
		const id = playbook?.id ?? routeId;
		if (!id || actionBusy) return;
		deactivating = true;
		actionError = undefined;

		try {
			const response = await fetch(
				`/api/playbooks/${encodeURIComponent(id)}/deactivate`,
				{ method: "POST" },
			);
			const payload: unknown = await response.json();
			if (!response.ok || !isRecord(payload)) {
				throw new Error(
					apiErrorDetail(payload, "Unable to deactivate playbook."),
				);
			}
			await loadPlaybookById(id, true);
			void loadPlaybooks();
		} catch (error) {
			actionError =
				error instanceof Error
					? error.message
					: "Unable to deactivate playbook.";
		} finally {
			deactivating = false;
		}
	}

	async function deletePlaybook(id: string, event?: MouseEvent) {
		event?.stopPropagation();
		event?.preventDefault();
		menuPlaybookId = undefined;
		if (deletingId || openingId || creating || actionBusy) return;

		deletingId = id;
		const previous = playbooks;
		playbooks = playbooks.filter((item) => item.id !== id);

		try {
			const response = await fetch(
				`/api/playbooks/${encodeURIComponent(id)}`,
				{ method: "DELETE" },
			);
			if (!response.ok) {
				throw new Error("Unable to delete playbook.");
			}

			if (routeId === id || playbook?.id === id) {
				clearEditor();
				await setPlaybookRoute(undefined);
			}
		} catch {
			playbooks = previous;
			actionError = "Unable to delete playbook.";
		} finally {
			deletingId = undefined;
		}
	}

	onMount(() => {
		void loadPlaybooks();
		void connectorsCache.load();
	});

	afterNavigate(() => {
		void syncFromRoute();
	});
</script>

<svelte:window
	onkeydown={onWindowKeydown}
	onpointerdown={onWindowPointerDown}
/>

<svelte:head>
	<title>{pageTitle}</title>
	<meta
		name="description"
		content="Create and manage scheduled playbooks."
	/>
</svelte:head>

<Page title={pageTitle} lead={pageLead} wide>
	{#snippet actions()}
		{#if showList}
			<button
				type="button"
				class="new-btn"
				disabled={creating || actionBusy}
				onclick={newPlaybook}
			>
				{#if creating}
					<UnicodeSpinner label="Creating playbook" />
				{:else}
					<Plus size={15} strokeWidth={2} />
				{/if}
				<span>New playbook</span>
			</button>
		{:else}
			<a class="all-link" href={resolve("/(chat)/playbooks")}
				>All playbooks</a
			>
			{#if showEditor && playbook}
				<button
					type="button"
					class="action-btn"
					disabled={!isDirty || actionBusy}
					onclick={savePlaybook}
				>
					{#if saving}
						<UnicodeSpinner label="Saving" />
					{/if}
					<span>{saving ? "Saving…" : "Save"}</span>
				</button>
				<button
					type="button"
					class="action-btn primary"
					disabled={actionBusy}
					onclick={deployPlaybook}
				>
					{#if deploying}
						<UnicodeSpinner label="Deploying" />
					{/if}
					<span>{deploying ? "Deploying…" : "Deploy"}</span>
				</button>
				<button
					type="button"
					class="action-btn"
					disabled={actionBusy || playbook.status !== "STATUS_ACTIVE"}
					onclick={deactivatePlaybook}
				>
					{#if deactivating}
						<UnicodeSpinner label="Deactivating" />
					{/if}
					<span>{deactivating ? "Deactivating…" : "Deactivate"}</span>
				</button>
				<button
					type="button"
					class="action-btn danger"
					disabled={actionBusy}
					onclick={() => {
						const id = playbook?.id;
						if (id) void deletePlaybook(id);
					}}
				>
					Delete
				</button>
			{/if}
		{/if}
	{/snippet}

		{#if showList}
			<section class="list-section" aria-label="Playbook list">
				{#if actionError}
					<p class="form-error">{actionError}</p>
				{/if}

				{#if playbooksLoading}
					<div class="state-block" aria-busy="true">
						<UnicodeSpinner label="Loading playbooks" />
						<p class="state-text">Loading playbooks…</p>
					</div>
				{:else if playbooksError}
					<div class="state-block">
						<p class="state-text">Unable to load playbooks.</p>
						<button
							type="button"
							class="retry-btn"
							onclick={loadPlaybooks}>Retry</button
						>
					</div>
				{:else if playbooks.length === 0}
					<div class="state-block">
						<p class="state-title">No playbooks yet</p>
						<p class="state-text">
							Create one to schedule a recurring agent run.
						</p>
					</div>
				{:else}
					<div class="board">
						{#each boardGroups as group, groupIndex (group.key)}
							<section
								class="board-group"
								class:tone-active={group.key === "active"}
								class:tone-draft={group.key === "draft"}
								class:tone-inactive={group.key === "inactive"}
								style="--group-i: {groupIndex}"
								aria-label={group.title}
							>
								<header class="board-group-head">
									<div class="board-group-title-row">
										<h2 class="board-group-title">
											{group.title}
										</h2>
										<span class="board-group-count"
											>{group.items.length}</span
										>
									</div>
									<p class="board-group-hint">{group.hint}</p>
								</header>

								<ul
									class="board-list"
									class:featured={group.key === "active"}
								>
									{#each group.items as item, itemIndex (item.id)}
										<li
											class="playbook-row"
											class:featured={group.key ===
												"active"}
											class:running={item.isRunning}
											class:opening={item.id ===
												openingId}
											class:closing={item.id ===
												deletingId}
											style="--i: {itemIndex}"
										>
											<button
												type="button"
												class="playbook-row-main"
												title={item.name}
												disabled={creating ||
													openingId !== undefined ||
													deletingId !== undefined ||
													actionBusy}
												onclick={() =>
													openPlaybook(item.id)}
											>
												<span
													class="status-mark"
													class:tone-active={statusTone(
														item.status,
													) === "active"}
													class:tone-inactive={statusTone(
														item.status,
													) === "inactive"}
													class:tone-draft={statusTone(
														item.status,
													) === "draft"}
													class:pulse={item.isRunning}
													aria-hidden="true"
												></span>

												<span class="playbook-copy">
													<span
														class="playbook-name-row"
													>
														<span
															class="playbook-name"
															>{item.name}</span
														>
														{#if item.isRunning}
															<span
																class="running-label"
																>Running</span
															>
														{/if}
													</span>
												</span>

												<span class="playbook-side">
													<span class="updated"
														>{formatUpdated(
															item.updatedAt,
														)}</span
													>
													{#if item.id === openingId}
														<UnicodeSpinner
															class="row-spinner"
															label="Opening playbook"
														/>
													{/if}
												</span>
											</button>

											<div
												class="playbook-menu"
												class:open={menuPlaybookId ===
													item.id}
											>
												<button
													type="button"
													class="playbook-menu-btn"
													aria-label="Playbook options"
													aria-haspopup="menu"
													aria-expanded={menuPlaybookId ===
														item.id}
													title="Playbook options"
													disabled={deletingId !==
														undefined ||
														creating ||
														actionBusy}
													onclick={(event) =>
														toggleMenu(
															item.id,
															event,
														)}
												>
													{#if item.id === deletingId}
														<UnicodeSpinner
															class="row-spinner"
															label="Deleting playbook"
														/>
													{:else}
														<Ellipsis
															size={13}
															strokeWidth={2}
														/>
													{/if}
												</button>
												{#if menuPlaybookId === item.id}
													<div
														class="playbook-menu-popover"
														role="menu"
													>
														<button
															type="button"
															class="playbook-menu-item"
															role="menuitem"
															onclick={(event) =>
																deletePlaybook(
																	item.id,
																	event,
																)}
														>
															Delete
														</button>
													</div>
												{/if}
											</div>
										</li>
									{/each}
								</ul>
							</section>
						{/each}
					</div>
				{/if}
			</section>
		{:else if showLoading}
			<section
				class="state-block"
				aria-label="Loading playbook"
				aria-busy="true"
			>
				<UnicodeSpinner label="Loading playbook" />
				<p class="state-text">Loading playbook…</p>
			</section>
		{:else if showError}
			<section class="state-block" aria-label="Playbook load error">
				<p class="state-text">{loadError}</p>
				<div class="state-actions">
					<button type="button" class="retry-btn" onclick={retryLoad}
						>Retry</button
					>
					<a
						class="retry-btn link"
						href={resolve("/(chat)/playbooks")}
						>All playbooks</a
					>
				</div>
			</section>
		{:else if showEditor && playbook}
			<section class="editor" aria-label="Playbook editor">
				{#if actionError}
					<p class="form-error">{actionError}</p>
				{/if}

				<form
					class="editor-form"
					onsubmit={(event) => {
						event.preventDefault();
						void savePlaybook();
					}}
				>
					<label class="field">
						<span class="field-label">Name</span>
						<input
							class="field-input"
							type="text"
							bind:value={name}
							disabled={actionBusy}
							placeholder="Untitled playbook"
						/>
					</label>

					<label class="field">
						<span class="field-label">Prompt</span>
						<textarea
							class="field-input field-textarea"
							bind:value={prompt}
							disabled={actionBusy}
							rows={8}
							placeholder="What should this playbook do?"
						></textarea>
					</label>

					<label class="field">
						<span class="field-label">Cron schedule</span>
						<input
							class="field-input"
							type="text"
							bind:value={cronString}
							disabled={actionBusy}
							placeholder="0 9 * * *"
							spellcheck="false"
						/>
					</label>

					<label class="field">
						<span class="field-label">Model</span>
						<select
							class="field-input"
							bind:value={llmModel}
							disabled={actionBusy}
						>
							{#each CHAT_MODELS as model (model.id)}
								<option value={model.id}>{model.label}</option>
							{/each}
						</select>
					</label>

					<fieldset
						class="field connectors-field"
						disabled={actionBusy}
					>
						<span class="field-label">Connectors</span>
						{#if connectorsCache.loading && !connectorsCache.loaded}
							<div class="connectors-loading">
								<UnicodeSpinner label="Loading connectors" />
							</div>
						{:else if connectorsCache.error}
							<button
								type="button"
								class="retry-btn inline"
								onclick={() => connectorsCache.load(true)}
								>Retry connectors</button
							>
						{:else if connectorsCache.connectors.length === 0}
							<p class="field-hint">No connectors available.</p>
						{:else}
							<div class="connector-list">
								{#each connectorsCache.connectors as connector (connector.id)}
									<label class="connector-row">
										<input
											type="checkbox"
											checked={connectorIds.includes(
												connector.id,
											)}
											onchange={() =>
												toggleConnector(connector.id)}
										/>
										<span class="connector-name"
											>{connector.name}</span
										>
										<span class="connector-type"
											>{connector.type}</span
										>
									</label>
								{/each}
							</div>
						{/if}
					</fieldset>

					<label class="field">
						<span class="field-label">Email addresses</span>
						<input
							class="field-input"
							type="text"
							bind:value={emailsText}
							disabled={actionBusy}
							placeholder="optional, comma-separated"
						/>
					</label>

					<label class="field">
						<span class="field-label">Slack channel id</span>
						<input
							class="field-input"
							type="text"
							bind:value={slackChannelId}
							disabled={actionBusy}
							placeholder="optional"
							spellcheck="false"
						/>
					</label>
				</form>
			</section>
		{/if}
</Page>

<style>
	.new-btn,
	.retry-btn,
	.playbook-row-main,
	.playbook-menu-btn,
	.playbook-menu-item,
	.action-btn,
	.all-link {
		border: 0;
		background: transparent;
		font: inherit;
		cursor: pointer;
		text-decoration: none;
	}

	.new-btn {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 9px;
		border-radius: var(--radius-sm);
		color: #3f3f46;
		background: color-mix(in srgb, #fff 70%, transparent);
		box-shadow: inset 0 0 0 1px
			color-mix(in srgb, var(--color-line) 75%, transparent);
		font-size: 12px;
		font-weight: 500;
		transition: background 120ms ease;
	}

	.new-btn:hover:not(:disabled) {
		background: color-mix(in srgb, #fff 92%, transparent);
	}

	.new-btn:disabled {
		cursor: wait;
		opacity: 0.75;
	}

	.new-btn :global(svg) {
		flex-shrink: 0;
	}

	.list-section {
		display: flex;
		flex-direction: column;
		gap: 14px;
		width: 100%;
	}

	.board {
		display: flex;
		flex-direction: column;
		gap: 28px;
		width: 100%;
	}

	.board-group {
		display: flex;
		flex-direction: column;
		gap: 10px;
		min-width: 0;
	}

	.board-group-head {
		display: flex;
		flex-direction: column;
		gap: 2px;
		padding-inline: 2px;
	}

	.board-group-title-row {
		display: flex;
		align-items: baseline;
		gap: 8px;
	}

	.board-group-title {
		margin: 0;
		color: var(--color-ink);
		font-family: var(--font-sans);
		font-size: 12px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	.board-group-count {
		color: var(--color-muted);
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 11px;
		font-weight: 500;
	}

	.board-group-hint {
		margin: 0;
		color: var(--color-muted);
		font-size: 11.5px;
		line-height: 1.4;
	}

	.board-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.board-list.featured {
		gap: 4px;
	}

	.playbook-row {
		display: flex;
		align-items: center;
		gap: 2px;
		border-radius: var(--radius-sm);
		transition: background 120ms ease;
		animation: board-in 280ms ease both;
		animation-delay: calc(var(--group-i) * 40ms + var(--i) * 28ms);
	}

	.playbook-row:hover {
		background: color-mix(in srgb, #fff 70%, transparent);
	}

	.playbook-row.featured {
		background: color-mix(in srgb, var(--color-paper) 88%, #fff);
		box-shadow: inset 0 0 0 1px
			color-mix(in srgb, var(--color-line) 70%, transparent);
	}

	.playbook-row.featured:hover {
		background: color-mix(in srgb, #fff 82%, var(--color-paper));
	}

	.playbook-row.opening,
	.playbook-row.closing {
		opacity: 0.65;
	}

	.playbook-row-main {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		column-gap: 12px;
		min-width: 0;
		flex: 1;
		padding: 10px 6px 10px 10px;
		color: inherit;
		text-align: left;
		border-radius: var(--radius-sm);
	}

	.playbook-row.featured .playbook-row-main {
		padding: 14px 8px 14px 14px;
	}

	.playbook-row-main:disabled {
		cursor: wait;
		opacity: 0.7;
	}

	.status-mark {
		position: relative;
		flex-shrink: 0;
		width: 7px;
		height: 7px;
		border-radius: 50%;
		background: #d6d3d1;
	}

	.status-mark.tone-active {
		background: #4ade80;
	}

	.status-mark.tone-draft {
		background: #fbbf24;
	}

	.status-mark.tone-inactive {
		background: #a8a29e;
	}

	.status-mark.pulse::after {
		content: "";
		position: absolute;
		inset: -3px;
		border-radius: 50%;
		background: color-mix(in srgb, #4ade80 45%, transparent);
		animation: status-ping 1.6s ease-out infinite;
	}

	.playbook-copy {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.playbook-name-row {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.playbook-name {
		min-width: 0;
		overflow: hidden;
		color: var(--color-ink);
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.playbook-row.featured .playbook-name {
		font-size: 14.5px;
		font-weight: 600;
	}

	.board-group.tone-inactive .playbook-name {
		color: color-mix(in srgb, var(--color-ink) 72%, var(--color-muted));
	}

	.running-label {
		flex-shrink: 0;
		color: #166534;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.02em;
		text-transform: uppercase;
	}

	.playbook-side {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
		align-self: start;
		padding-top: 2px;
	}

	.updated {
		flex-shrink: 0;
		color: var(--color-muted);
		font-size: 11.5px;
	}

	.playbook-menu {
		position: relative;
		flex-shrink: 0;
		margin-right: 4px;
	}

	.playbook-menu-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		color: var(--color-muted);
		opacity: 0;
		pointer-events: none;
		transition:
			opacity 120ms ease,
			background 120ms ease,
			color 120ms ease;
	}

	.playbook-row:hover .playbook-menu-btn,
	.playbook-menu-btn:focus-visible,
	.playbook-row.closing .playbook-menu-btn,
	.playbook-menu.open .playbook-menu-btn,
	.playbook-menu:focus-within .playbook-menu-btn {
		opacity: 1;
		pointer-events: auto;
	}

	.playbook-menu-btn:hover:not(:disabled) {
		color: var(--color-ink);
		background: color-mix(in srgb, #fff 70%, transparent);
	}

	.playbook-menu-btn:disabled {
		cursor: wait;
	}

	.playbook-menu-popover {
		position: absolute;
		top: calc(100% + 2px);
		right: 0;
		z-index: 5;
		min-width: 96px;
		padding: 3px;
		border: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, var(--color-paper) 96%, #fff);
		box-shadow: 0 4px 14px rgba(15, 15, 20, 0.06);
	}

	.playbook-menu-item {
		display: block;
		width: 100%;
		padding: 6px 8px;
		border-radius: 5px;
		color: #52525b;
		font-size: 12px;
		text-align: left;
	}

	.playbook-menu-item:hover {
		color: var(--color-ink);
		background: color-mix(in srgb, #fff 70%, transparent);
	}

	.playbook-row :global(.row-spinner) {
		flex-shrink: 0;
		opacity: 0.85;
	}

	@keyframes board-in {
		from {
			opacity: 0;
			transform: translateY(6px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes status-ping {
		0% {
			opacity: 0.55;
			transform: scale(0.85);
		}
		70% {
			opacity: 0;
			transform: scale(1.65);
		}
		100% {
			opacity: 0;
			transform: scale(1.65);
		}
	}

	.state-block {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 48px 16px;
		text-align: center;
	}

	.state-title {
		margin: 0;
		color: var(--color-ink);
		font-size: 15px;
		font-weight: 500;
	}

	.state-text {
		margin: 0;
		color: var(--color-muted);
		font-size: 13px;
		line-height: 1.45;
	}

	.state-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
		justify-content: center;
	}

	.retry-btn {
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		color: var(--color-accent);
		font-size: 12.5px;
	}

	.retry-btn.inline {
		align-self: flex-start;
		padding-inline: 0;
	}

	.retry-btn.link {
		display: inline-flex;
		align-items: center;
	}

	.retry-btn:hover {
		background: color-mix(in srgb, #fff 60%, transparent);
	}

	.editor {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.all-link {
		display: inline-flex;
		color: var(--color-muted);
		font-size: 12.5px;
		font-weight: 500;
		text-decoration: none;
	}

	.all-link:hover {
		color: var(--color-ink);
	}

	.action-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 5px;
		padding: 5px 9px;
		border-radius: var(--radius-sm);
		color: #3f3f46;
		background: color-mix(in srgb, #fff 70%, transparent);
		box-shadow: inset 0 0 0 1px
			color-mix(in srgb, var(--color-line) 75%, transparent);
		font-size: 12px;
		font-weight: 500;
		transition: background 120ms ease;
	}

	.action-btn:hover:not(:disabled) {
		background: color-mix(in srgb, #fff 92%, transparent);
	}

	.action-btn:disabled {
		cursor: not-allowed;
		opacity: 0.55;
	}

	.action-btn.primary {
		color: #fff;
		background: var(--color-ink);
		box-shadow: none;
	}

	.action-btn.primary:hover:not(:disabled) {
		background: color-mix(in srgb, var(--color-ink) 88%, #fff);
	}

	.action-btn.danger {
		color: #b91c1c;
	}

	.editor-form {
		display: flex;
		flex-direction: column;
		gap: 14px;
		width: min(720px, 100%);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
		margin: 0;
		border: 0;
		padding: 0;
		min-width: 0;
	}

	.field-label {
		color: var(--color-muted);
		font-size: 11px;
		font-weight: 500;
		letter-spacing: 0.01em;
	}

	.field-input {
		width: 100%;
		padding: 9px 11px;
		border: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
		border-radius: var(--radius-sm);
		color: var(--color-ink);
		background: color-mix(in srgb, #fff 78%, transparent);
		font: inherit;
		font-size: 13px;
		line-height: 1.4;
	}

	.field-textarea {
		resize: vertical;
		min-height: 140px;
		line-height: 1.55;
	}

	.field-hint {
		margin: 0;
		color: var(--color-muted);
		font-size: 12px;
	}

	.connectors-field {
		gap: 8px;
	}

	.connectors-loading {
		display: flex;
		align-items: center;
		min-height: 1.5em;
	}

	.connector-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		max-height: 180px;
		overflow-y: auto;
		padding: 6px;
		border: 1px solid color-mix(in srgb, var(--color-line) 85%, transparent);
		border-radius: var(--radius-sm);
		background: color-mix(in srgb, #fff 60%, transparent);
	}

	.connector-row {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 5px 6px;
		border-radius: 6px;
		font-size: 12.5px;
		cursor: pointer;
	}

	.connector-row:hover {
		background: color-mix(in srgb, #fff 70%, transparent);
	}

	.connector-name {
		min-width: 0;
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--color-ink);
	}

	.connector-type {
		flex-shrink: 0;
		color: var(--color-muted);
		font-size: 11px;
	}

	.form-error {
		margin: 0 0 4px;
		color: #b91c1c;
		font-size: 12.5px;
	}

	@media (max-width: 560px) {
		.playbook-row-main {
			grid-template-columns: auto minmax(0, 1fr);
			row-gap: 6px;
			padding-inline: 10px 4px;
		}

		.playbook-row.featured .playbook-row-main {
			padding: 12px 6px 12px 12px;
		}

		.playbook-side {
			grid-column: 2;
			justify-content: flex-start;
			padding-top: 0;
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.playbook-row {
			animation: none;
		}

		.status-mark.pulse::after {
			animation: none;
			display: none;
		}
	}
</style>
