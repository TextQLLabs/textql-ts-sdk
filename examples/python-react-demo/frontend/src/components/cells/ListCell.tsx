import { useState } from 'react';

import { CELL_BODY, CELL_META } from '../../lib/cellText';
import { cx } from '../../lib/cx';
import { CellError } from '../CellShell';
import type { CellComponent, CellComponentProps } from './types';

const PAGE = 8;

type Row = { title: string; subtitle?: string };

type Spec = {
	/** Payload key holding the array. */
	key: string;
	noun: string;
	row: (item: Record<string, unknown>) => Row;
};

function str(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

function records(value: unknown): Record<string, unknown>[] {
	return Array.isArray(value)
		? value.filter((item): item is Record<string, unknown> => typeof item === 'object' && item !== null)
		: [];
}

/**
 * The list-* cells differ only in which array they read and how a row reads.
 * They share a body because they share a failure mode: an org with hundreds of
 * dashboards used to render hundreds of rows into the transcript.
 */
export function makeListCell(spec: Spec): CellComponent {
	function ListCell({ payload }: CellComponentProps) {
		const [showAll, setShowAll] = useState(false);

		const error = str(payload.errorMessage);
		const items = records(payload[spec.key]).map(spec.row);
		const total = Number(payload.totalCount ?? items.length) || items.length;
		const search = str(payload.searchTerm);
		const shown = showAll ? items : items.slice(0, PAGE);

		if (error) return <CellError message={error} />;

		if (items.length === 0) {
			return (
				<p className={cx(CELL_BODY, 'm-0 text-muted')}>
					{search ? `No ${spec.noun} matching “${search}”.` : `No ${spec.noun}.`}
				</p>
			);
		}

		return (
			<>
				<p className={cx(CELL_META, 'm-0 text-muted')}>
					{total} {spec.noun}
					{search && ` matching “${search}”`}
				</p>

				<ul className="m-0 flex list-none flex-col gap-1 p-0">
					{shown.map((item, i) => (
						<li key={i} className="flex min-w-0 flex-col gap-px">
							<span className={cx(CELL_BODY, 'font-medium text-ink')}>{item.title}</span>
							{item.subtitle && (
								<span className={cx(CELL_META, 'text-muted')}>{item.subtitle}</span>
							)}
						</li>
					))}
				</ul>

				{items.length > PAGE && (
					<button
						type="button"
						className={cx(
							CELL_META,
							'cursor-pointer self-start border-0 bg-transparent p-0 font-medium text-[#2563eb] hover:underline'
						)}
						onClick={() => setShowAll((current) => !current)}
					>
						{showAll ? 'Show fewer' : `Show all ${items.length}`}
					</button>
				)}
			</>
		);
	}

	ListCell.displayName = `ListCell(${spec.key})`;
	return ListCell;
}
