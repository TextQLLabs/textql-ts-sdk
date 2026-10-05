/**
 * This demo's choice. Uploads go straight to storage, so the server sets no
 * limit; TextQL copies a table into the agent's sandbox up to 500 MB.
 */
export const MAX_UPLOAD_BYTES = 100_000_000;
