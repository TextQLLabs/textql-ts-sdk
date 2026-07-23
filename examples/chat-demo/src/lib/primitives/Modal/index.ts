export { default as Modal } from './Modal.svelte';
export { default as Confirm } from './Confirm.svelte';
// Imperative, promise-based confirmation: `if (await confirm({...})) { ... }`
export { confirm } from './confirm';
export type { ConfirmTone, ConfirmOptions } from './types';
