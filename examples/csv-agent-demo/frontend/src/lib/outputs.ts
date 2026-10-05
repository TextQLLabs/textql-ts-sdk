import { asRecords, asString, getCellCase, getCellPayload, type CellLike } from '@ui/lib/cells';
import { collectPreviewItems, guessPreviewType, type PreviewItem } from '@ui/lib/previewPanel';

export type Outputs = { tables: PreviewItem[]; charts: PreviewItem[]; files: PreviewItem[] };

export const IMAGE_TYPES = new Set(['chart', 'image']);
const HTML_TYPES = new Set(['html', 'echarts']);

function isTable(item: PreviewItem): boolean {
	return item.previewType === 'csv' || guessPreviewType(item.name) === 'csv';
}

/** HTML URLs of Python charts that also have a PNG; previews of those are duplicates. */
function htmlTwins(cells: CellLike[]): Set<string> {
	const urls = new Set<string>();
	for (const cell of cells) {
		if (getCellCase(cell) !== 'pyCell') continue;
		for (const chart of asRecords(getCellPayload(cell).charts)) {
			const html = asString(chart.htmlUrl);
			if (html && asString(chart.pngUrl)) urls.add(html);
		}
	}
	return urls;
}

/**
 * Everything the agent produced, sorted into the three places the UI shows it.
 * A Python chart is its PNG; its HTML twin only stands in when no image exists.
 */
export function collectOutputs(cells: CellLike[]): Outputs {
	const out: Outputs = { tables: [], charts: [], files: [] };
	const twins = htmlTwins(cells);
	const tableNames = new Set<string>();
	const html: PreviewItem[] = [];
	for (const item of collectPreviewItems(cells)) {
		if (item.url && twins.has(item.url)) continue;
		if (isTable(item)) {
			if (tableNames.has(item.name)) continue;
			tableNames.add(item.name);
			out.tables.push(item);
		} else if (IMAGE_TYPES.has(item.previewType)) out.charts.push(item);
		else if (HTML_TYPES.has(item.previewType)) html.push(item);
		else out.files.push(item);
	}
	if (out.charts.length === 0) out.charts = html;
	else out.files.push(...html);
	return out;
}
