import {
	ArrowDownLeft,
	Database,
	FileText,
	Filter,
	Layers,
	Link2,
	SlidersHorizontal,
	Tag
} from 'lucide-react';
import type { ReactNode } from 'react';

import { cx } from '../lib/cx';
import { hasTqlStructure, parseTql, resolveImport, stripNounPrefix } from '../lib/tqlParse';
import { PierreCode } from './PierreCode';

type Props = {
	content: string;
	filePath?: string;
	showSource?: boolean;
	onNavigateToImport?: (resolvedPath: string) => void;
};

// Padding is applied per use-site: stacking `pb-1` on top of a constant that
// already carries `pb-1.5` would let Tailwind's rule order pick the winner.
const LABEL_BASE =
	'flex items-center gap-1.5 text-[10px] font-semibold tracking-[0.05em] text-muted uppercase';
const LABEL = `${LABEL_BASE} pb-1.5`;
const COUNT = 'text-[color-mix(in_srgb,var(--color-muted)_70%,transparent)]';
const TABLE_WRAP = 'overflow-hidden rounded-xs border border-line';
const TABLE = 'w-full border-collapse text-[12px]';
const TH =
	'border-b border-line bg-ink/3 px-2.5 py-1.5 text-left font-medium text-muted';
const TD = 'border-b border-line/60 px-2.5 py-1.5 text-ink';
const MONO = 'font-mono';
const MUTED = 'text-muted';
const PILL = 'rounded-xs bg-ink/6 px-2 py-0.5 text-[11px] font-medium text-text-2';

function Section({ label, children }: { label: ReactNode; children: ReactNode }) {
	return (
		<div>
			<div className={LABEL}>{label}</div>
			{children}
		</div>
	);
}

export function TqlPreview({
	content,
	filePath = '',
	showSource = true,
	onNavigateToImport = undefined
}: Props) {
	const parsed = parseTql(content);
	const hasStructure = hasTqlStructure(parsed);

	return (
		<div className="flex h-full min-h-0 flex-col">
			{hasStructure && (
				<div className="flex flex-col gap-4">
					{(parsed.role || parsed.title || parsed.description) && (
						<div>
							{(parsed.role || parsed.title) && (
								<div className="flex items-center gap-2">
									{parsed.title && (
										<h4 className="m-0 text-[13px] font-semibold text-ink">{parsed.title}</h4>
									)}
									{parsed.role && (
										<span
											className={cx(
												'inline-block flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em] uppercase',
												parsed.role === 'Object module'
													? 'bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-elevate))] text-[#1d4ed8]'
													: parsed.role === 'Composed view'
														? 'bg-[#ecfdf5] text-[#047857]'
														: 'bg-line/35 text-text-3'
											)}
										>
											{parsed.role}
										</span>
									)}
								</div>
							)}
							{parsed.description && (
								<p className="mt-0.5 mb-0 text-[12px] leading-normal text-muted">
									{parsed.description}
								</p>
							)}
						</div>
					)}

					{parsed.backing && (
						<div className="rounded-xs bg-ink/4 px-3 py-2">
							<div className={`${LABEL_BASE} pb-1`}>
								<Database size={12} />
								Backing Table
							</div>
							<p className="m-0 font-mono text-[12px] text-ink">{parsed.backing}</p>
						</div>
					)}

					{parsed.imports.length > 0 && (
						<Section
							label={
								<>
									<ArrowDownLeft size={12} />
									Imports
								</>
							}
						>
							<div className="flex flex-col gap-1">
								{parsed.imports.map((imp) => (
									<button
										key={imp.path}
										type="button"
										className="flex w-full items-center justify-between gap-2 rounded-xs border-0 bg-ink/4 px-2.5 py-1.5 text-left transition-[background] duration-[120ms] not-disabled:cursor-pointer hover:not-disabled:bg-ink/8"
										disabled={!onNavigateToImport}
										onClick={() => onNavigateToImport?.(resolveImport(filePath, imp.path))}
									>
										<span className={MONO}>{imp.alias}</span>
										<span
											className="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-muted"
											title={imp.path}
										>
											{imp.path}
										</span>
									</button>
								))}
							</div>
						</Section>
					)}

					{parsed.relations.length > 0 && (
						<Section
							label={
								<>
									<Link2 size={12} />
									Relations
									<span className={COUNT}>({parsed.relations.length})</span>
								</>
							}
						>
							<div className={TABLE_WRAP}>
								<table className={TABLE}>
									<thead>
										<tr>
											<th className={TH}>Joins</th>
											<th className={TH}>On</th>
										</tr>
									</thead>
									<tbody className="[&_tr:last-child_td]:border-b-0">
										{parsed.relations.map((rel) => (
											<tr key={`${rel.joined}/${rel.parent}`}>
												<td className={cx(TD, MONO)} title={`${rel.parent} → ${rel.joined}`}>
													{rel.joined}
												</td>
												<td className={cx(TD, MONO, MUTED)}>
													{rel.parent}.{rel.fk} = {rel.joined}.{rel.pk}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</Section>
					)}

					{parsed.params.length > 0 && (
						<Section
							label={
								<>
									<SlidersHorizontal size={12} />
									Parameters
								</>
							}
						>
							<div className={TABLE_WRAP}>
								<table className={TABLE}>
									<thead>
										<tr>
											<th className={TH}>Name</th>
											<th className={TH}>Type</th>
											<th className={TH}>Default</th>
										</tr>
									</thead>
									<tbody className="[&_tr:last-child_td]:border-b-0">
										{parsed.params.map((param) => (
											<tr key={param.name}>
												<td className={cx(TD, MONO)}>{param.name}</td>
												<td
													className={cx(
														TD,
														'max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap text-muted'
													)}
													title={param.type}
												>
													{param.type}
												</td>
												<td className={cx(TD, MONO, MUTED)}>{param.default ?? '—'}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</Section>
					)}

					{parsed.metrics.length > 0 && (
						<Section
							label={
								<>
									<Layers size={12} />
									Metrics
									<span className={COUNT}>({parsed.metrics.length})</span>
								</>
							}
						>
							{parsed.metrics.some((m) => m.expr) ? (
								<div className={TABLE_WRAP}>
									<table className={TABLE}>
										<thead>
											<tr>
												<th className={TH}>Name</th>
												<th className={TH}>Expression</th>
											</tr>
										</thead>
										<tbody className="[&_tr:last-child_td]:border-b-0">
											{parsed.metrics.map((metric) => (
												<tr key={metric.name}>
													<td className={cx(TD, 'font-medium')}>{metric.name}</td>
													<td className={cx(TD, MONO, MUTED)}>{metric.expr ?? '—'}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className="flex flex-wrap gap-1">
									{parsed.metrics.map((metric) => (
										<span key={metric.name} className={PILL}>
											{metric.name}
										</span>
									))}
								</div>
							)}
						</Section>
					)}

					{parsed.dimensions.length > 0 && (
						<Section
							label={
								<>
									<Tag size={12} />
									Dimensions
									<span className={COUNT}>({parsed.dimensions.length})</span>
								</>
							}
						>
							{parsed.dimensions.some((d) => d.expr) ? (
								<div className={TABLE_WRAP}>
									<table className={TABLE}>
										<thead>
											<tr>
												<th className={TH}>Label</th>
												<th className={TH}>Column</th>
											</tr>
										</thead>
										<tbody className="[&_tr:last-child_td]:border-b-0">
											{parsed.dimensions.map((dim) => (
												<tr key={dim.key}>
													<td className={cx(TD, 'font-medium')}>{dim.label}</td>
													<td className={cx(TD, MONO, MUTED)}>{dim.expr ?? '—'}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							) : (
								<div className="flex flex-wrap gap-1">
									{parsed.dimensions.map((dim) => (
										<span key={dim.key} className={PILL}>
											{dim.label}
										</span>
									))}
								</div>
							)}
						</Section>
					)}

					{parsed.filters.length > 0 && (
						<Section
							label={
								<>
									<Filter size={12} />
									Filters
									<span className={COUNT}>({parsed.filters.length})</span>
								</>
							}
						>
							<div className="flex flex-wrap gap-1">
								{parsed.filters.map((filter) => (
									<span key={filter} className={PILL}>
										{stripNounPrefix(filter)}
									</span>
								))}
							</div>
						</Section>
					)}

					{parsed.comments.length > 0 && (
						<Section
							label={
								<>
									<FileText size={12} />
									Details
								</>
							}
						>
							<div className="flex flex-col gap-1">
								{parsed.comments.map((comment, i) => (
									<div className="flex gap-2 text-[12px]" key={i}>
										<span className="flex-shrink-0 font-medium text-text-3">{comment.key}</span>
										<span className={MUTED}>{comment.value}</span>
									</div>
								))}
							</div>
						</Section>
					)}
				</div>
			)}

			{showSource && (
				<div className="mt-4 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xs border border-line">
					<div className="flex-shrink-0 border-b border-line bg-ink/3 px-3 py-1.5 text-[10px] font-semibold tracking-[0.05em] text-muted uppercase">
						Source
					</div>
					<PierreCode fileName={filePath || 'file.tql'} contents={content} lang="sql" fill />
				</div>
			)}
		</div>
	);
}
