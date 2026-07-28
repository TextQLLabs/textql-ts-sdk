export { default as Toaster } from './Toaster.svelte';
// Re-export the imperative API so callers import everything from one place:
// `import { Toaster, toast } from '../lib/primitives';`
export { toast } from 'svelte-sonner';
