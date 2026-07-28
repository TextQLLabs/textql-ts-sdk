/** Visual class of a confirmation dialog. */
export type ConfirmTone = "danger" | "warning" | "info" | "neutral";

/** Options for the imperative `confirm()` helper. */
export interface ConfirmOptions {
  title?: string;
  /** Message body shown under the title. */
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` for destructive actions (deletes), etc. Defaults to `info`. */
  tone?: ConfirmTone;
}
