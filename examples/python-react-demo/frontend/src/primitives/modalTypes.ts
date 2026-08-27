/** Options for the imperative `confirm()` helper. */
export interface ConfirmOptions {
  title?: string;
  /** Message body shown under the title. */
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}
