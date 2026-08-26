import { writable } from 'svelte/store';

export type ToastTone = 'default' | 'success' | 'error';
export type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };
export const toasts = writable<ToastItem[]>([]);
let nextId = 1;

function push(title: string, options: { description?: string; tone?: ToastTone } = {}): number {
	const id = nextId++;
	toasts.update((items) => [...items, { id, title, description: options.description, tone: options.tone ?? 'default' }]);
	setTimeout(() => dismiss(id), 4500);
	return id;
}

function dismiss(id: number): void { toasts.update((items) => items.filter((item) => item.id !== id)); }
export const toast = Object.assign(push, {
	success: (title: string, options: { description?: string } = {}) => push(title, { ...options, tone: 'success' }),
	error: (title: string, options: { description?: string } = {}) => push(title, { ...options, tone: 'error' }),
	dismiss
});
