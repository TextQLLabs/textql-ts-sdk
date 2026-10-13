import { Check, Code, Copy, Table } from 'lucide-react';
import { useState } from 'react';

import { asString as str, getCellExecTime } from '../../lib/cells';
import { connectorIconSrc } from '../../lib/connectorIcons';
import { useConnector } from '../../lib/connectorsCache';
import { CELL_META, CODE_PRE } from '../../lib/cellText';
import { cx } from '../../lib/cx';
import { useCopyToClipboard } from '../../lib/useCopyToClipboard';
import { ViewSwitcher, ViewSwitcherList, ViewSwitcherPanel, type View } from '../../primitives';
import { CellError } from '../CellShell';
import { PierreCode } from '../PierreCode';
import { CellFrame } from './CellFrame';
import type { CellComponentProps } from './types';

/**
 * Query and result are the two things anyone reads in a SQL cell, and both are
 * long. They page in place rather than stacking two scrollers.
 */
export function SqlCell({ cell, payload }: CellComponentProps) {
	const query = str(payload.query);
	const result = str(payload.dataframePreview);

	const views: View[] = [
		...(query ? [{ value: 'query', label: 'Query', icon: Code }] : []),
		...(result ? [{ value: 'result', label: 'Result', icon: Table }] : [])
	];

	const [view, setView] = useState(views[0]?.value ?? 'query');
	const { copied, copy } = useCopyToClipboard();

	// An unapproved connector is the one thing in this cell the user must act on.
	const authPending = payload.authRequired === true && payload.authCompleted !== true;
	const connector = str(payload.authConnectorName) || str(payload.authProviderName);
	const time = getCellExecTime(cell);
	// Resolves after the connector list lands; until then the bare id stands in.
	const connectorInfo = useConnector(payload.connectorId);
	const connectorLabel =
		connectorInfo?.name ||
		(payload.connectorId === undefined ? '' : `Connector ${String(payload.connectorId)}`);
	const meta = [payload.agentMemory === true ? 'Agent memory' : '', time].filter(Boolean);

	if (views.length === 0) return <CellFrame cell={cell} />;

	const actions = (
		<>
			{connectorLabel && (
				<span className={cx(CELL_META, 'inline-flex min-w-0 items-center gap-1 text-muted')}>
					{connectorInfo && (
						<img className="size-3 shrink-0" src={connectorIconSrc(connectorInfo.type)} alt="" />
					)}
					<span className="truncate">{connectorLabel}</span>
				</span>
			)}
			{meta.length > 0 && (
				<span className={cx(CELL_META, 'shrink-0 text-muted')}>
					{connectorLabel && '· '}
					{meta.join(' · ')}
				</span>
			)}
			<ViewSwitcherList className={cx(CELL_META, 'shrink-0')} />
			<button
				type="button"
				className={cx(
					CELL_META,
					'cursor-pointer border-0 bg-transparent p-0 text-muted hover:text-ink'
				)}
				aria-label="Copy"
				onClick={() => void copy(view === 'query' ? query : result)}
			>
				{copied ? <Check size={12} /> : <Copy size={12} />}
			</button>
		</>
	);

	return (
		<ViewSwitcher views={views} value={view} onValueChange={setView}>
			<CellFrame cell={cell} actions={actions}>
				{authPending && (
					<CellError
						message={`Authentication required for ${connector || 'this connector'}.`}
					/>
				)}

				<ViewSwitcherPanel value="query">
					<PierreCode fileName="query.sql" contents={query} lang="sql" />
				</ViewSwitcherPanel>

				<ViewSwitcherPanel value="result">
					<pre className={cx(CODE_PRE, 'max-h-80')}>{result}</pre>
				</ViewSwitcherPanel>
			</CellFrame>
		</ViewSwitcher>
	);
}
