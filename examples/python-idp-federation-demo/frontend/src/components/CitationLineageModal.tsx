import type { FitViewOptions } from '@xyflow/react';
import { Check, ChevronRight, Code, Copy, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { CELL_LABEL, CELL_META, CODE_PRE } from '../lib/cellText';
import { cellCodeDetail, inspectableCellIds } from '../lib/citationCodeDetail';
import {
	citationLineageModal,
	useCitationLineageModal,
	type CitationLineageModalState
} from '../lib/citationLineageModal';
import { cx } from '../lib/cx';
import { parsePreviewTable } from '../lib/dataframePreview';
import { useCopyToClipboard } from '../lib/useCopyToClipboard';
import { Modal, ViewSwitcher, ViewSwitcherList, ViewSwitcherPanel, type View } from '../primitives';
import { DataframeTable } from './DataframeTable';
import { LineageMap } from './lineage/LineageMap';
import { PANEL_ICON_BTN } from './pageStyles';
import { PierreCode } from './PierreCode';

/** Room the map leaves on the right while the code panel is open. */
const CODE_PANEL_FIT_PADDING: FitViewOptions['padding'] = {
	top: '24px',
	bottom: '24px',
	left: '24px',
	right: '680px'
};

const HEADER_BTN = cx(
	CELL_META,
	'inline-flex cursor-pointer items-center rounded-[4px] border-0 bg-transparent p-1 text-muted hover:bg-ink/8 hover:text-ink'
);

/**
 * Full-window view of one citation's lineage. Clicking a cell-backed node
 * slides in that cell's code and result; the map re-fits around the panel.
 * Mounted once at the app root and driven by `citationLineageModal`.
 */
export function CitationLineageModal() {
	const current = useCitationLineageModal();
	return (
		<Modal
			open={current !== null}
			size="full"
			title="Citation lineage"
			onClose={() => citationLineageModal.close()}
		>
			{/* Keyed per open so the body's state starts fresh on the requested node. */}
			{current && (
				<LineageModalBody
					key={`${current.citation.key}:${current.initialCellId ?? ''}`}
					{...current}
				/>
			)}
		</Modal>
	);
}

function LineageModalBody({ citation, cellsById, initialCellId }: CitationLineageModalState) {
	const inspectableIds = useMemo(
		() => inspectableCellIds(citation, cellsById),
		[citation, cellsById]
	);
	const requested = initialCellId ?? citation.sourceCellId;
	const initialNodeId = requested && inspectableIds.has(requested) ? requested : null;

	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialNodeId);
	const [detailTab, setDetailTab] = useState('input');
	const { copied, copy } = useCopyToClipboard();

	const detail = selectedNodeId ? cellCodeDetail(cellsById.get(selectedNodeId)) : null;
	const views: View[] = detail
		? [
				{ value: 'input', label: detail.inputLabel },
				{ value: 'output', label: detail.outputLabel }
			]
		: [];
	const table = useMemo(
		() => (detail?.outputFormat === 'dataframe' ? parsePreviewTable(detail.output) : null),
		[detail?.outputFormat, detail?.output]
	);

	function onNodeClick(id: string) {
		// Toggle: clicking the open node again dismisses the panel.
		setSelectedNodeId((prev) => (prev === id ? null : id));
		setDetailTab('input');
	}

	return (
		<div className="relative flex min-h-0 flex-1">
			<div className="min-h-0 flex-1">
				<LineageMap
					citation={citation}
					inspectableIds={inspectableIds}
					selectedCellId={selectedNodeId}
					flush
					fitPadding={initialNodeId ? CODE_PANEL_FIT_PADDING : 0.15}
					onNodeClick={onNodeClick}
				/>
			</div>

			{/* The code panel has its own close control, so the dialog's would double up. */}
			{!detail && (
				<button
					type="button"
					className={cx(PANEL_ICON_BTN, 'absolute top-3 right-3 z-10 text-muted hover:bg-ink/5 hover:text-ink')}
					aria-label="Close"
					onClick={() => citationLineageModal.close()}
				>
					<X size={16} />
				</button>
			)}

			{detail && (
				<ViewSwitcher views={views} value={detailTab} onValueChange={setDetailTab}>
					<div className="absolute top-3 right-3 bottom-3 z-10 flex w-[32rem] max-w-[calc(100%-1.5rem)] animate-preview-in flex-col overflow-hidden rounded-sm border border-line bg-elevate shadow-lg">
						<div className="flex items-center gap-2 border-b border-line px-3 py-2">
							<Code size={14} className="shrink-0 text-muted" />
							<span className={cx(CELL_LABEL, 'text-muted')}>{detail.kind}</span>
							<ViewSwitcherList className={cx(CELL_META, 'ml-auto shrink-0')} />
							<button
								type="button"
								className={HEADER_BTN}
								aria-label="Copy"
								onClick={() => void copy(detailTab === 'input' ? detail.code : detail.output)}
							>
								{copied ? <Check size={14} /> : <Copy size={14} />}
							</button>
							<button
								type="button"
								className={HEADER_BTN}
								aria-label="Close code panel"
								onClick={() => setSelectedNodeId(null)}
							>
								<ChevronRight size={14} />
							</button>
						</div>
						<div className="min-h-0 flex-1 overflow-auto p-3">
							<ViewSwitcherPanel value="input">
								<PierreCode fileName={detail.fileName} contents={detail.code} lang={detail.lang} />
							</ViewSwitcherPanel>
							<ViewSwitcherPanel value="output">
								{!detail.output ? (
									<p className={cx(CELL_META, 'm-0 text-muted italic')}>No result preview available.</p>
								) : table ? (
									<DataframeTable {...table} fill />
								) : (
									<pre className={CODE_PRE}>{detail.output}</pre>
								)}
							</ViewSwitcherPanel>
						</div>
					</div>
				</ViewSwitcher>
			)}
		</div>
	);
}
