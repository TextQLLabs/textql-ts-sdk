import { Check, ShieldAlert, X } from 'lucide-react';
import { useState } from 'react';

import { resolveCell } from '../lib/api';
import { type CellLike } from '../lib/cells';
import { getHalt, type Halt } from '../lib/halts';
import { toast } from '../primitives';

type Props = { cell: CellLike; onResolved?: () => void };

const CARD =
	'flex flex-col gap-2 rounded-sm border border-[color-mix(in_srgb,var(--color-accent)_28%,var(--color-line))] bg-elevate/55 px-3 py-2.5';
const TITLE = 'flex min-w-0 items-center gap-[7px] text-[12.5px] font-semibold text-ink';
const DETAIL = 'm-0 text-[12px] leading-[1.55] whitespace-pre-wrap text-muted wrap-anywhere';
const ACTION =
	'inline-flex cursor-pointer items-center gap-1.5 rounded-xs border-0 px-2.5 py-1.5 text-[12px] font-medium disabled:cursor-wait disabled:opacity-60';
const PRIMARY = `${ACTION} bg-accent text-white hover:opacity-90`;
const SECONDARY = `${ACTION} bg-fill text-text-2 hover:bg-elevate`;

/**
 * The action bar for a cell the run is parked on. Rendered as its own segment
 * rather than inside a collapsed tool batch: a halt that nobody can see is a
 * chat that looks hung.
 */
export function HaltCell({ cell, onResolved }: Props) {
	const halt = getHalt(cell);
	if (!halt) return null;
	return <ApprovalHalt cell={cell} halt={halt} onResolved={onResolved} />;
}

function ApprovalHalt({
	cell,
	halt,
	onResolved
}: {
	cell: CellLike;
	halt: Halt;
	onResolved?: () => void;
}) {
	const [pending, setPending] = useState<'approve' | 'reject' | null>(null);
	const [done, setDone] = useState<string | null>(null);
	const kind = halt.kind === 'ontology' ? 'ontology' : 'context_prompt';

	async function act(action: 'approve' | 'reject') {
		if (typeof cell.id !== 'string' || !cell.id) return;
		setPending(action);
		try {
			await resolveCell(cell.id, kind, action);
			setDone(action === 'approve' ? 'Approved' : 'Rejected');
			toast.success(action === 'approve' ? 'Change approved' : 'Change rejected');
			onResolved?.();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'That did not go through.');
		} finally {
			setPending(null);
		}
	}

	return (
		<div className={CARD}>
			<div className={TITLE}>
				<ShieldAlert size={14} className="shrink-0 text-accent" />
				<span className="min-w-0 truncate">{halt.title}</span>
				<span className="ml-auto shrink-0 text-[11px] font-medium text-muted">
					{done ?? 'Waiting on you'}
				</span>
			</div>
			{halt.detail && <p className={DETAIL}>{halt.detail}</p>}
			{!done && (
				<div className="flex gap-1.5">
					<button
						type="button"
						className={PRIMARY}
						disabled={pending !== null}
						onClick={() => void act('approve')}
					>
						<Check size={13} />
						Approve
					</button>
					<button
						type="button"
						className={SECONDARY}
						disabled={pending !== null}
						onClick={() => void act('reject')}
					>
						<X size={13} />
						Reject
					</button>
				</div>
			)}
		</div>
	);
}
