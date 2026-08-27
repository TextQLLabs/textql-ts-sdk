import { Check, Copy } from 'lucide-react';
import { useState } from 'react';

import { formatExecTimeMs } from '../../lib/cellBlocks';
import { isCellFinished } from '../../lib/cells';
import { CELL_BODY, CELL_CODE, CELL_LABEL, CELL_META } from '../../lib/cellText';
import { cx } from '../../lib/cx';
import { CellError } from '../CellShell';
import { PierreCode } from '../PierreCode';
import type { CellComponentProps } from './types';

type Tab = 'query' | 'result';

const TAB = cx(
	CELL_LABEL,
	'cursor-pointer rounded-xs border-0 bg-transparent px-1.5 py-0.5 text-muted hover:text-ink'
);
const TAB_ON = 'bg-ink/6 text-ink';

function str(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

/**
 * Query and result are the two things anyone reads in a SQL cell, and they are
 * both long. Tabs keep the cell one screenful instead of stacking two scrollers.
 */
export function SqlCell({ cell, payload }: CellComponentProps) {
	const query = str(payload.query);
	const result = str(payload.dataframePreview);

	const [tab, setTab] = useState<Tab>('query');
	const [copied, setCopied] = useState(false);

	const shown = tab === 'query' ? query : result;

	// An unapproved connector is the one thing in this cell the user must act on.
	const authPending = payload.authRequired === true && payload.authCompleted !== true;
	const connector = str(payload.authConnectorName) || str(payload.authProviderName);
	const time = isCellFinished(cell)
		? formatExecTimeMs(payload.executionTimeMs ?? cell.durationMs)
		: '';
	const meta = [
		payload.connectorId === undefined ? '' : `Connector ${String(payload.connectorId)}`,
		payload.agentMemory === true ? 'Agent memory' : '',
		time
	].filter(Boolean);

	async function copy() {
		await navigator.clipboard.writeText(shown);
		setCopied(true);
		setTimeout(() => setCopied(false), 1200);
	}

	if (!query && !result) return null;

	return (
		<>
			{authPending && (
				<CellError
					message={`Authentication required for ${connector || 'this connector'} — approve it in the TextQL app.`}
				/>
			)}

			<div className="flex items-center gap-1">
				{query && (
					<button
						type="button"
						className={cx(TAB, tab === 'query' && TAB_ON)}
						onClick={() => setTab('query')}
					>
						Query
					</button>
				)}
				{result && (
					<button
						type="button"
						className={cx(TAB, tab === 'result' && TAB_ON)}
						onClick={() => setTab('result')}
					>
						Result
					</button>
				)}
				{meta.length > 0 && (
					<span className={cx(CELL_META, 'ml-1 truncate text-muted')}>{meta.join(' · ')}</span>
				)}
				<button
					type="button"
					className={cx(CELL_META, 'ml-auto cursor-pointer border-0 bg-transparent p-0 text-muted hover:text-ink')}
					aria-label={`Copy ${tab}`}
					onClick={() => void copy()}
				>
					{copied ? <Check size={12} /> : <Copy size={12} />}
				</button>
			</div>

			{tab === 'query' ? (
				<PierreCode fileName="query.sql" contents={query} lang="sql" />
			) : (
				<pre className={cx(CELL_CODE, 'm-0 max-h-80 overflow-auto rounded-xs bg-ink/5 px-2.5 py-2 whitespace-pre')}>
					{result}
				</pre>
			)}

			{!shown && <p className={cx(CELL_BODY, 'm-0 text-muted')}>Nothing to show.</p>}
		</>
	);
}
