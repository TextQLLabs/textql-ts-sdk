/**
 * A `dataframePreview` is the server's plain-text rendering of a result set:
 * a couple of summary lines, then a markdown pipe table.
 *
 *     Rows: 23, Columns: 1
 *      table_name: 23 non-null String
 *     |    | table_name |
 *     |---:| ---        |
 *     | 0  | memory_log |
 *
 * Pulling the table back out beats showing the ASCII, and falling back to the
 * raw text costs nothing when a cell's preview isn't shaped like this.
 */

export type PreviewTable = {
	/** The lines above the table — row/column counts and dtypes. */
	caption: string;
	columns: string[];
	rows: string[][];
};

/** `|---:|` / `| :--- |` / `|----|` — the row that makes it a table, not prose. */
function isSeparator(cells: string[]): boolean {
	return cells.length > 0 && cells.every((cell) => /^:?-{2,}:?$/.test(cell.trim()));
}

function splitRow(line: string): string[] {
	return line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|');
}

export function parsePreviewTable(text: string): PreviewTable | null {
	if (!text.includes('|')) return null;
	const lines = text.split('\n');

	const header = lines.findIndex(
		(line, i) =>
			line.trim().startsWith('|') &&
			i + 1 < lines.length &&
			lines[i + 1]!.trim().startsWith('|') &&
			isSeparator(splitRow(lines[i + 1]!))
	);
	if (header === -1) return null;

	const columns = splitRow(lines[header]!).map((cell) => cell.trim());
	const rows: string[][] = [];
	for (const line of lines.slice(header + 2)) {
		if (!line.trim().startsWith('|')) break;
		const cells = splitRow(line).map((cell) => cell.trim());
		// Pad or trim so every row lines up with the header, whatever the server sent.
		while (cells.length < columns.length) cells.push('');
		rows.push(cells.slice(0, columns.length));
	}
	if (rows.length === 0) return null;

	return {
		caption: lines.slice(0, header).join('\n').trim(),
		columns,
		rows
	};
}
