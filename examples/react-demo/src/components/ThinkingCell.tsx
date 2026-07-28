import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getCellPayload, type CellLike } from '../lib/cells';
import { cx } from '../lib/cx';

type Props = {
	cell: CellLike;
	/** True while this thinking segment is still streaming. */
	active?: boolean;
};

const ROW =
	'flex w-full min-h-8 items-center gap-1.5 rounded-sm border-0 bg-transparent px-1.5 py-1 text-left font-[inherit]';
const LABEL = 'min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium text-muted';

export function ThinkingCell({ cell, active = false }: Props) {
	const payload = getCellPayload(cell);
	const redacted = payload.redacted === true;
	const content = typeof payload.content === 'string' ? payload.content.trim() : '';
	const hasContent = redacted || content.length > 0;
	const isThinking = active && !cell.complete;

	const [expanded, setExpanded] = useState(false);
	const [openedManually, setOpenedManually] = useState(false);

	// Live thoughts stay open while streaming...
	useEffect(() => {
		if (isThinking) setExpanded(true);
	}, [isThinking]);

	// ...then tuck away shortly after, unless the user opened them on purpose.
	useEffect(() => {
		if (isThinking || !expanded || openedManually || !hasContent) return;
		const timeout = setTimeout(() => setExpanded(false), 2000);
		return () => clearTimeout(timeout);
	}, [isThinking, expanded, openedManually, hasContent]);

	const visible = isThinking || hasContent;
	const showBody = expanded && hasContent;
	const bodyText = redacted ? 'Thinking (redacted)' : content;

	if (!visible) return null;

	function toggle() {
		setExpanded((current) => {
			setOpenedManually(!current);
			return !current;
		});
	}

	return (
		<div className="w-full">
			{isThinking ? (
				<div className={ROW}>
					{/* .shimmer comes from app.css */}
					<span className={cx(LABEL, 'shimmer')}>Thinking…</span>
				</div>
			) : (
				<button type="button" className={cx(ROW, 'cursor-pointer hover:bg-ink/4')} onClick={toggle}>
					<ChevronRight
						size={14}
						className={cx(
							'shrink-0 text-[#a1a1aa] transition-transform duration-150 motion-reduce:transition-none',
							expanded && 'rotate-90'
						)}
					/>
					<span className={LABEL}>Thought process</span>
				</button>
			)}

			{showBody && (
				<pre className="m-0 ml-3 border-l-2 border-line py-0 pt-0.5 pr-2 pb-2 pl-[22px] font-[inherit] text-[12.5px] leading-[1.55] italic whitespace-pre-wrap text-[#a1a1aa] wrap-anywhere">
					{bodyText}
				</pre>
			)}
		</div>
	);
}
