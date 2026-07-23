<script lang="ts">
	import Database from "@lucide/svelte/icons/database";
	import Layers from "@lucide/svelte/icons/layers";
	import SlidersHorizontal from "@lucide/svelte/icons/sliders-horizontal";
	import Filter from "@lucide/svelte/icons/filter";
	import ArrowDownLeft from "@lucide/svelte/icons/arrow-down-left";
	import FileText from "@lucide/svelte/icons/file-text";
	import Tag from "@lucide/svelte/icons/tag";
	import Link2 from "@lucide/svelte/icons/link-2";
	import PierreCode from "$lib/components/PierreCode.svelte";
	import {
		hasTqlStructure,
		parseTql,
		resolveImport,
		stripNounPrefix,
	} from "$lib/tqlParse";

	let {
		content,
		filePath = "",
		showSource = true,
		onNavigateToImport = undefined,
	}: {
		content: string;
		filePath?: string;
		showSource?: boolean;
		onNavigateToImport?: (resolvedPath: string) => void;
	} = $props();

	const parsed = $derived(parseTql(content));
	const hasStructure = $derived(hasTqlStructure(parsed));
</script>

<div class="tql">
	{#if hasStructure}
		<div class="sections">
			{#if parsed.role || parsed.title || parsed.description}
				<div class="head">
					{#if parsed.role || parsed.title}
						<div class="head-row">
							{#if parsed.title}
								<h4 class="title">{parsed.title}</h4>
							{/if}
							{#if parsed.role}
								<span
									class="role-badge"
									class:role-object={parsed.role === "Object module"}
									class:role-view={parsed.role === "Composed view"}
								>
									{parsed.role}
								</span>
							{/if}
						</div>
					{/if}
					{#if parsed.description}
						<p class="description">{parsed.description}</p>
					{/if}
				</div>
			{/if}

			{#if parsed.backing}
				<div class="backing">
					<div class="section-label">
						<Database size={12} />
						Backing Table
					</div>
					<p class="backing-value">{parsed.backing}</p>
				</div>
			{/if}

			{#if parsed.imports.length > 0}
				<div>
					<div class="section-label">
						<ArrowDownLeft size={12} />
						Imports
					</div>
					<div class="import-list">
						{#each parsed.imports as imp (imp.path)}
							<button
								type="button"
								class="import-row"
								disabled={!onNavigateToImport}
								onclick={() =>
									onNavigateToImport?.(resolveImport(filePath, imp.path))}
							>
								<span class="mono">{imp.alias}</span>
								<span class="import-path" title={imp.path}>{imp.path}</span>
							</button>
						{/each}
					</div>
				</div>
			{/if}

			{#if parsed.relations.length > 0}
				<div>
					<div class="section-label">
						<Link2 size={12} />
						Relations
						<span class="count">({parsed.relations.length})</span>
					</div>
					<div class="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Joins</th>
									<th>On</th>
								</tr>
							</thead>
							<tbody>
								{#each parsed.relations as rel (rel.joined + "/" + rel.parent)}
									<tr>
										<td class="mono" title={`${rel.parent} → ${rel.joined}`}>
											{rel.joined}
										</td>
										<td class="mono muted">
											{rel.parent}.{rel.fk} = {rel.joined}.{rel.pk}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			{#if parsed.params.length > 0}
				<div>
					<div class="section-label">
						<SlidersHorizontal size={12} />
						Parameters
					</div>
					<div class="table-wrap">
						<table>
							<thead>
								<tr>
									<th>Name</th>
									<th>Type</th>
									<th>Default</th>
								</tr>
							</thead>
							<tbody>
								{#each parsed.params as param (param.name)}
									<tr>
										<td class="mono">{param.name}</td>
										<td class="truncate" title={param.type}>{param.type}</td>
										<td class="mono muted">{param.default ?? "—"}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			{#if parsed.metrics.length > 0}
				<div>
					<div class="section-label">
						<Layers size={12} />
						Metrics
						<span class="count">({parsed.metrics.length})</span>
					</div>
					{#if parsed.metrics.some((m) => m.expr)}
						<div class="table-wrap">
							<table>
								<thead>
									<tr>
										<th>Name</th>
										<th>Expression</th>
									</tr>
								</thead>
								<tbody>
									{#each parsed.metrics as metric (metric.name)}
										<tr>
											<td class="strong">{metric.name}</td>
											<td class="mono muted">{metric.expr ?? "—"}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="pills">
							{#each parsed.metrics as metric (metric.name)}
								<span class="pill">{metric.name}</span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			{#if parsed.dimensions.length > 0}
				<div>
					<div class="section-label">
						<Tag size={12} />
						Dimensions
						<span class="count">({parsed.dimensions.length})</span>
					</div>
					{#if parsed.dimensions.some((d) => d.expr)}
						<div class="table-wrap">
							<table>
								<thead>
									<tr>
										<th>Label</th>
										<th>Column</th>
									</tr>
								</thead>
								<tbody>
									{#each parsed.dimensions as dim (dim.key)}
										<tr>
											<td class="strong">{dim.label}</td>
											<td class="mono muted">{dim.expr ?? "—"}</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					{:else}
						<div class="pills">
							{#each parsed.dimensions as dim (dim.key)}
								<span class="pill">{dim.label}</span>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			{#if parsed.filters.length > 0}
				<div>
					<div class="section-label">
						<Filter size={12} />
						Filters
						<span class="count">({parsed.filters.length})</span>
					</div>
					<div class="pills">
						{#each parsed.filters as filter (filter)}
							<span class="pill">{stripNounPrefix(filter)}</span>
						{/each}
					</div>
				</div>
			{/if}

			{#if parsed.comments.length > 0}
				<div>
					<div class="section-label">
						<FileText size={12} />
						Details
					</div>
					<div class="details">
						{#each parsed.comments as comment, i (i)}
							<div class="detail-row">
								<span class="detail-key">{comment.key}</span>
								<span class="muted">{comment.value}</span>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	{#if showSource}
		<div class="source">
			<div class="source-head">Source</div>
			<PierreCode
				fileName={filePath || "file.tql"}
				contents={content}
				lang="sql"
				fill
			/>
		</div>
	{/if}
</div>

<style>
	.tql {
		display: flex;
		flex-direction: column;
		height: 100%;
		min-height: 0;
	}

	.sections {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.head-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.title {
		margin: 0;
		font-size: 13px;
		font-weight: 600;
		color: var(--color-ink);
	}

	.role-badge {
		display: inline-block;
		flex-shrink: 0;
		padding: 2px 8px;
		border-radius: 999px;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		color: var(--color-text-3);
		background: color-mix(in srgb, var(--color-line) 35%, transparent);
	}

	.role-badge.role-object {
		color: #1d4ed8;
		background: color-mix(in srgb, var(--color-accent) 8%, var(--color-elevate));
	}

	.role-badge.role-view {
		color: #047857;
		background: #ecfdf5;
	}

	.description {
		margin: 2px 0 0;
		font-size: 12px;
		line-height: 1.5;
		color: var(--color-muted);
	}

	.section-label {
		display: flex;
		align-items: center;
		gap: 6px;
		padding-bottom: 6px;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-muted);
	}

	.count {
		color: color-mix(in srgb, var(--color-muted) 70%, transparent);
	}

	.backing {
		padding: 8px 12px;
		border-radius: var(--radius-sm, 8px);
		background: color-mix(in srgb, var(--color-ink) 4%, transparent);
	}

	.backing .section-label {
		padding-bottom: 4px;
	}

	.backing-value {
		margin: 0;
		font-family: var(--font-mono, ui-monospace, monospace);
		font-size: 12px;
		color: var(--color-ink);
	}

	.import-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.import-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 8px;
		width: 100%;
		padding: 6px 10px;
		border: 0;
		border-radius: 6px;
		text-align: left;
		background: color-mix(in srgb, var(--color-ink) 4%, transparent);
		font: inherit;
		transition: background 120ms ease;
	}

	.import-row:not(:disabled) {
		cursor: pointer;
	}

	.import-row:not(:disabled):hover {
		background: color-mix(in srgb, var(--color-ink) 8%, transparent);
	}

	.import-path {
		overflow: hidden;
		font-size: 11px;
		color: var(--color-muted);
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.table-wrap {
		overflow: hidden;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm, 8px);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 12px;
	}

	th {
		padding: 6px 10px;
		text-align: left;
		font-weight: 500;
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-ink) 3%, transparent);
		border-bottom: 1px solid var(--color-line);
	}

	td {
		padding: 6px 10px;
		color: var(--color-ink);
		border-bottom: 1px solid
			color-mix(in srgb, var(--color-line) 60%, transparent);
	}

	tbody tr:last-child td {
		border-bottom: 0;
	}

	.mono {
		font-family: var(--font-mono, ui-monospace, monospace);
	}

	.muted {
		color: var(--color-muted);
	}

	.strong {
		font-weight: 500;
	}

	.truncate {
		max-width: 180px;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--color-muted);
	}

	.pills {
		display: flex;
		flex-wrap: wrap;
		gap: 4px;
	}

	.pill {
		padding: 2px 8px;
		border-radius: 6px;
		font-size: 11px;
		font-weight: 500;
		color: var(--color-text-2);
		background: color-mix(in srgb, var(--color-ink) 6%, transparent);
	}

	.details {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.detail-row {
		display: flex;
		gap: 8px;
		font-size: 12px;
	}

	.detail-key {
		flex-shrink: 0;
		font-weight: 500;
		color: var(--color-text-3);
	}

	.source {
		display: flex;
		flex-direction: column;
		flex: 1;
		min-height: 0;
		margin-top: 16px;
		border: 1px solid var(--color-line);
		border-radius: var(--radius-sm, 8px);
		overflow: hidden;
	}

	.source-head {
		flex-shrink: 0;
		padding: 6px 12px;
		font-size: 10px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-muted);
		background: color-mix(in srgb, var(--color-ink) 3%, transparent);
		border-bottom: 1px solid var(--color-line);
	}
</style>
