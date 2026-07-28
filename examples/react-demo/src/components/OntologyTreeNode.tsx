import {
	ChevronRight,
	Database,
	File as FileIcon,
	FileCode,
	FileCog,
	FileJson,
	FileSpreadsheet,
	FileText,
	Folder as FolderIcon,
	FolderOpen as FolderOpenIcon,
	Image as ImageIcon,
	type LucideIcon
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { cx } from '../lib/cx';
import { pierreFileIconId, usePierreIconsReady } from '../lib/pierreIcons';
import { isRecord } from '../lib/utils';

// Per-extension file icons (lucide), falling back to a generic file icon.
const FILE_ICONS: Record<string, LucideIcon> = {
	json: FileJson,
	csv: FileSpreadsheet,
	tsv: FileSpreadsheet,
	sql: Database,
	md: FileText,
	markdown: FileText,
	txt: FileText,
	yaml: FileCog,
	yml: FileCog,
	toml: FileCog,
	py: FileCode,
	ts: FileCode,
	tsx: FileCode,
	js: FileCode,
	jsx: FileCode,
	go: FileCode,
	rs: FileCode,
	rb: FileCode,
	java: FileCode,
	c: FileCode,
	cpp: FileCode,
	sh: FileCode,
	bash: FileCode,
	png: ImageIcon,
	jpg: ImageIcon,
	jpeg: ImageIcon,
	gif: ImageIcon,
	svg: ImageIcon,
	webp: ImageIcon
};

function fileIcon(name: string): LucideIcon {
	return FILE_ICONS[name.split('.').pop()?.toLowerCase() ?? ''] ?? FileIcon;
}

export type Entry = { path: string; name: string; isDir: boolean; sizeBytes: number };

type Props = {
	entry: Entry;
	depth?: number;
	selectedPath: string | undefined;
	/** Deep-link target: ancestor dirs of this path auto-expand to reveal it. */
	revealPath?: string;
	onSelect: (entry: Entry) => void;
};

const HINT = 'm-0 py-[0.15rem] text-[11.5px] text-muted';

export function OntologyTreeNode({ entry, depth = 0, selectedPath, revealPath, onSelect }: Props) {
	const iconsReady = usePierreIconsReady();
	const [expanded, setExpanded] = useState(false);
	const [children, setChildren] = useState<Entry[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(false);
	const autoRevealed = useRef(false);

	// Children are fetched lazily the first time a directory is opened.
	async function loadChildren() {
		setLoading(true);
		setError(false);
		try {
			const res = await fetch(`/api/ontology?path=${encodeURIComponent(entry.path)}`);
			const body: unknown = await res.json();
			if (!res.ok || !isRecord(body) || !Array.isArray(body.entries)) throw new Error();
			setChildren(body.entries as Entry[]);
		} catch {
			setError(true);
		} finally {
			setLoading(false);
		}
	}

	// Auto-expand once if this directory is an ancestor of the deep-linked path,
	// cascading down as children mount.
	useEffect(() => {
		if (autoRevealed.current || !entry.isDir || !revealPath) return;
		if (revealPath === entry.path || revealPath.startsWith(`${entry.path}/`)) {
			autoRevealed.current = true;
			if (!expanded) {
				setExpanded(true);
				if (children === null) void loadChildren();
			}
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- one-shot reveal
	}, [revealPath, entry.isDir, entry.path]);

	function activate() {
		if (!entry.isDir) {
			onSelect(entry);
			return;
		}
		const next = !expanded;
		setExpanded(next);
		if (next && children === null) void loadChildren();
	}

	const indent = depth * 14 + 8;
	const pid = !entry.isDir && iconsReady ? pierreFileIconId(entry.name) : undefined;
	const Icon = fileIcon(entry.name);
	const childIndent = { paddingLeft: `${indent + 14}px` };

	return (
		<>
			<button
				className={cx(
					'flex w-full cursor-pointer items-center gap-[0.4rem] rounded-xs border-0 px-[0.45rem] py-[0.28rem] text-left text-[12.5px] text-ink',
					selectedPath === entry.path ? 'bg-accent/12' : 'bg-transparent hover:bg-ink/5'
				)}
				style={{ paddingLeft: `${indent}px` }}
				onClick={activate}
			>
				{entry.isDir ? (
					<>
						<ChevronRight
							size={13}
							className={cx(
								'shrink-0 text-muted transition-transform duration-[120ms] ease-[ease]',
								expanded && 'rotate-90'
							)}
						/>
						{expanded ? (
							<FolderOpenIcon size={15} strokeWidth={1.75} />
						) : (
							<FolderIcon size={15} strokeWidth={1.75} />
						)}
					</>
				) : (
					<>
						<span className="inline-block w-[13px] shrink-0" />
						{pid ? (
							<svg className="shrink-0" width="15" height="15" aria-hidden="true">
								<use href={`#${pid}`} />
							</svg>
						) : (
							<Icon size={15} strokeWidth={1.75} />
						)}
					</>
				)}
				<span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{entry.name}</span>
			</button>

			{entry.isDir &&
				expanded &&
				(loading ? (
					<p className={HINT} style={childIndent}>
						Loading…
					</p>
				) : error ? (
					<p className={cx(HINT, 'text-[#dc2626]')} style={childIndent}>
						Failed to load
					</p>
				) : children && children.length === 0 ? (
					<p className={HINT} style={childIndent}>
						Empty
					</p>
				) : children ? (
					children.map((child) => (
						<OntologyTreeNode
							key={child.path}
							entry={child}
							depth={depth + 1}
							selectedPath={selectedPath}
							revealPath={revealPath}
							onSelect={onSelect}
						/>
					))
				) : null)}
		</>
	);
}
