/** Mirrors SUPPORTED_TABULAR_EXTENSIONS in the TextQL app's upload path. */
export const TABULAR_EXTENSIONS = ['.csv', '.tsv', '.xlsx', '.xls', '.xlsm', '.parquet', '.ods'];

/**
 * This demo's choice. Uploads go straight to storage, so the server sets no
 * limit; TextQL copies a table into the agent's sandbox up to 500 MB.
 */
export const MAX_UPLOAD_BYTES = 100_000_000;

function extension(name: string): string {
	const dot = name.lastIndexOf('.');
	return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

export function isTabularFile(name: string): boolean {
	return TABULAR_EXTENSIONS.includes(extension(name));
}

/** CSV and TSV are read from their own bytes; binary formats need TextQL to parse them. */
export function isTextTable(name: string): boolean {
	return ['.csv', '.tsv'].includes(extension(name));
}
