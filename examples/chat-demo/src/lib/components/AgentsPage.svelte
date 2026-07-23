<script lang="ts">
	import { onMount } from "svelte";
	import { resolve } from "$app/paths";
	import AgentIdenticon from "$lib/components/AgentIdenticon.svelte";
	import UnicodeSpinner from "$lib/components/UnicodeSpinner.svelte";
	import { formatCron } from "$lib/cron";
	import { Page } from "$lib/primitives";
	import { isRecord } from "$lib/utils";

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
		key: "active" | "inactive";
		title: string;
		hint: string;
		agents: AgentListItem[];
	};

	let agents = $state<AgentListItem[]>([]);
	let loading = $state(true);
	let error = $state(false);

	function formatLastPost(value: string | null) {
		if (!value) return "Never posted";
		const date = new Date(value);
		if (Number.isNaN(date.getTime())) return "Never posted";

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

		if (dayDiff === 0) return "Posted today";
		if (dayDiff === 1) return "Posted yesterday";
		return `Posted ${date.toLocaleDateString(undefined, {
			month: "short",
			day: "numeric",
			year:
				date.getFullYear() !== today.getFullYear()
					? "numeric"
					: undefined,
		})}`;
	}

	function scheduleLabel(agent: AgentListItem) {
		if (agent.schedules.length === 0) return "No schedule";
		if (agent.schedules.length === 1) return formatCron(agent.schedules[0]);
		return `${agent.schedules.length} schedules`;
	}

	const groups = $derived.by((): AgentGroup[] => {
		const active: AgentListItem[] = [];
		const inactive: AgentListItem[] = [];
		for (const agent of agents) {
			if (agent.isActive) active.push(agent);
			else inactive.push(agent);
		}
		const result: AgentGroup[] = [];
		if (active.length) {
			result.push({
				key: "active",
				title: "Active",
				hint: "Currently running",
				agents: active,
			});
		}
		if (inactive.length) {
			result.push({
				key: "inactive",
				title: "Inactive",
				hint: "Paused — won’t run",
				agents: inactive,
			});
		}
		return result;
	});

	function parseAgent(item: unknown): AgentListItem | null {
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
			isActive: item.isActive === true,
			profileImageUrl:
				typeof item.profileImageUrl === "string"
					? item.profileImageUrl
					: null,
			ownerName:
				typeof item.ownerName === "string" ? item.ownerName : null,
			llmModel: typeof item.llmModel === "string" ? item.llmModel : null,
			schedules: Array.isArray(item.schedules)
				? item.schedules.filter(
						(cron): cron is string => typeof cron === "string",
					)
				: [],
			lastPostAt:
				typeof item.lastPostAt === "string" ? item.lastPostAt : null,
		};
	}

	async function loadAgents() {
		loading = true;
		error = false;

		try {
			const response = await fetch("/api/agents");
			const payload: unknown = await response.json();

			if (
				!response.ok ||
				!isRecord(payload) ||
				!Array.isArray(payload.agents)
			) {
				throw new Error("Unable to load agents.");
			}

			agents = payload.agents
				.map(parseAgent)
				.filter((item): item is AgentListItem => item !== null);
		} catch {
			error = true;
		} finally {
			loading = false;
		}
	}

	onMount(() => {
		void loadAgents();
	});
</script>

<svelte:head>
	<title>Agents</title>
	<meta name="description" content="Browse the agents in your workspace." />
</svelte:head>

<Page title="Agents" lead="Browse the agents in your workspace." wide>
	<section class="list-section" aria-label="Agent list">
		{#if loading}
			<div class="state-block" aria-busy="true">
				<UnicodeSpinner label="Loading agents" />
				<p class="state-text">Loading agents…</p>
			</div>
		{:else if error}
			<div class="state-block">
				<p class="state-text">Unable to load agents.</p>
				<button type="button" class="retry-btn" onclick={loadAgents}
					>Retry</button
				>
			</div>
		{:else if agents.length === 0}
			<div class="state-block">
				<p class="state-title">No agents yet</p>
				<p class="state-text">
					Agents you create will show up here.
				</p>
			</div>
		{:else}
			<div class="board">
				{#each groups as group (group.key)}
					<section
						class="board-group"
						class:tone-inactive={group.key === "inactive"}
						aria-label={group.title}
					>
						<header class="board-group-head">
							<div class="board-group-title-row">
								<h2 class="board-group-title">{group.title}</h2>
								<span class="board-group-count"
									>{group.agents.length}</span
								>
							</div>
							<p class="board-group-hint">{group.hint}</p>
						</header>

						<ul class="board-list">
							{#each group.agents as agent (agent.id)}
								<li>
									<a
										class="agent-row"
										href={resolve("/(chat)/agents/[id]", {
											id: agent.id,
										})}
									>
									<span class="agent-avatar" aria-hidden="true">
										{#if agent.profileImageUrl}
											<img
												class="agent-pfp"
												src={agent.profileImageUrl}
												alt=""
												loading="lazy"
											/>
										{:else}
											<AgentIdenticon
												name={agent.name}
												agentId={agent.id}
												isActive={agent.isActive}
												size={30}
											/>
										{/if}
									</span>

									<span class="agent-copy">
										<span class="agent-name-row">
											<span class="agent-name"
												title={agent.name}
												>{agent.name}</span
											>
											{#if agent.llmModel}
												<span class="agent-model"
													>{agent.llmModel}</span
												>
											{/if}
										</span>
										<span class="agent-meta">
											<span
												class="agent-schedule"
												title={agent.schedules[0] ??
													undefined}
											>
												{scheduleLabel(agent)}
											</span>
											{#if agent.ownerName}
												<span
													class="agent-owner"
													title={agent.ownerName}
													>{agent.ownerName}</span
												>
											{/if}
										</span>
									</span>

									<span class="agent-side">
										{formatLastPost(agent.lastPostAt)}
									</span>
									</a>
								</li>
							{/each}
						</ul>
					</section>
				{/each}
			</div>
		{/if}
	</section>
</Page>

<style>
	.retry-btn {
		border: 0;
		background: transparent;
		font: inherit;
		cursor: pointer;
	}

	.list-section {
		display: flex;
		flex-direction: column;
		gap: 14px;
		width: 100%;
		flex: 1;
		min-height: 0;
		overflow-y: auto;
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

	.agent-row {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr) auto;
		align-items: center;
		column-gap: 12px;
		min-width: 0;
		padding: 10px 10px;
		border-radius: var(--radius-sm);
		color: inherit;
		text-decoration: none;
		cursor: pointer;
		transition: background 120ms ease;
	}

	.agent-row:hover {
		background: color-mix(in srgb, var(--color-elevate) 70%, transparent);
	}

	.agent-avatar {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 30px;
		height: 30px;
		border-radius: var(--radius-sm);
		overflow: hidden;
		color: var(--color-ink);
		background: color-mix(in srgb, var(--color-line) 30%, transparent);
	}

	.agent-pfp {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.agent-copy {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.agent-name-row {
		display: flex;
		align-items: center;
		gap: 8px;
		min-width: 0;
	}

	.agent-name {
		min-width: 0;
		overflow: hidden;
		color: var(--color-ink);
		font-family: var(--font-sans);
		font-size: 13px;
		font-weight: 500;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.board-group.tone-inactive .agent-name {
		color: color-mix(in srgb, var(--color-ink) 72%, var(--color-muted));
	}

	.agent-model {
		flex-shrink: 0;
		padding: 1px 6px;
		border-radius: 999px;
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-line) 30%, transparent);
		font-size: 10px;
		font-weight: 500;
		letter-spacing: 0.02em;
	}

	.agent-meta {
		display: flex;
		align-items: center;
		gap: 10px;
		min-width: 0;
	}

	.agent-schedule,
	.agent-owner {
		min-width: 0;
		overflow: hidden;
		color: var(--color-muted);
		font-family: var(--font-sans);
		font-size: 11.5px;
		line-height: 1.35;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.agent-side {
		flex-shrink: 0;
		color: var(--color-muted);
		font-size: 11.5px;
		white-space: nowrap;
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

	.retry-btn {
		padding: 6px 10px;
		border-radius: var(--radius-sm);
		color: var(--color-accent);
		font-size: 12.5px;
	}

	.retry-btn:hover {
		background: color-mix(in srgb, var(--color-elevate) 60%, transparent);
	}

	@media (max-width: 560px) {
		.agent-row {
			grid-template-columns: auto minmax(0, 1fr);
			row-gap: 6px;
		}

		.agent-side {
			grid-column: 2;
		}
	}
</style>
