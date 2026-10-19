import { cx } from '../lib/cx';
import type { PreviewTable } from '../lib/dataframePreview';

type Props = Omit<PreviewTable, 'caption'> & {
	caption?: string;
	/** Let the host scroll instead of capping the table; a step caps, a modal fills. */
	fill?: boolean;
};

/** A parsed `dataframePreview` as a real table: dtype caption, sticky header. */
export function DataframeTable({ caption, columns, rows, fill = false }: Props) {
	return (
		<div className="flex min-w-0 flex-col gap-1">
			{caption && (
				<p className="m-0 text-[11.5px] leading-[1.5] whitespace-pre-wrap text-muted">{caption}</p>
			)}
			<div className={cx(!fill && 'max-h-80', 'overflow-auto rounded-xs border border-line')}>
				<table className="w-full border-collapse text-left font-mono text-[11.5px]">
					<thead>
						<tr>
							{columns.map((column, c) => (
								<th
									key={c}
									// Sticky so the header survives scrolling a long result;
									// it needs its own background to cover the rows beneath.
									className="sticky top-0 z-[1] border-b border-line bg-fill px-2 py-1 font-medium whitespace-nowrap text-muted"
								>
									{column}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{rows.map((row, r) => (
							<tr key={r} className="border-b border-line/60 last:border-b-0">
								{row.map((value, c) => (
									<td key={c} className="px-2 py-1 align-top whitespace-nowrap text-text-strong">
										{value}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
