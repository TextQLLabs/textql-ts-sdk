/** shadcn Base UI toast (add/close/promise).
 *  success/error/dismiss stay as aliases because MutationTracker already calls them. */
import { writable } from 'svelte/store';

export type ToastType = 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading';

/** Base UI `actionProps`: `children` is the button label. */
export interface ToastAction {
	children: string;
	onClick: () => void;
}

export interface ToastOptions {
	title: string;
	description?: string;
	type?: ToastType;
	actionProps?: ToastAction;
	/** Milliseconds before auto-dismiss; 0 keeps it until closed. */
	timeout?: number;
}

export interface ToastItem extends ToastOptions {
	id: number;
	type: ToastType;
}

/** Base UI's default: extra toasts stay in the stack but stop rendering. */
export const TOAST_LIMIT = 3;
const DEFAULT_TIMEOUT = 4500;

export const toasts = writable<ToastItem[]>([]);

let nextId = 1;
interface Countdown {
	timer: ReturnType<typeof setTimeout>;
	remaining: number;
	startedAt: number;
}
const timers = new Map<number, Countdown>();
let paused = false;

function clearTimer(id: number): void {
	const countdown = timers.get(id);
	if (countdown) {
		clearTimeout(countdown.timer);
		timers.delete(id);
	}
}

function schedule(id: number, timeout: number): void {
	clearTimer(id);
	if (timeout <= 0) return;
	if (paused) {
		// Registered but not counting: resume() starts the clock.
		timers.set(id, { timer: 0 as unknown as ReturnType<typeof setTimeout>, remaining: timeout, startedAt: 0 });
		return;
	}
	timers.set(id, { timer: setTimeout(() => close(id), timeout), remaining: timeout, startedAt: Date.now() });
}

/** Holds every countdown on hover/focus so a toast being read cannot vanish mid-sentence. */
function pause(): void {
	if (paused) return;
	paused = true;
	for (const [id, countdown] of timers) {
		clearTimeout(countdown.timer);
		const elapsed = countdown.startedAt ? Date.now() - countdown.startedAt : 0;
		timers.set(id, { ...countdown, remaining: Math.max(0, countdown.remaining - elapsed), startedAt: 0 });
	}
}

function resume(): void {
	if (!paused) return;
	paused = false;
	for (const [id, countdown] of timers) {
		timers.set(id, {
			...countdown,
			timer: setTimeout(() => close(id), countdown.remaining),
			startedAt: Date.now()
		});
	}
}

function add(options: ToastOptions): number {
	const id = nextId++;
	const type = options.type ?? 'default';
	toasts.update((items) => [...items, { ...options, id, type }]);
	// A loading toast has no natural end; whoever opened it has to resolve it.
	schedule(id, options.timeout ?? (type === 'loading' ? 0 : DEFAULT_TIMEOUT));
	return id;
}

function update(id: number, options: Partial<ToastOptions>): void {
	toasts.update((items) =>
		items.map((item) => (item.id === id ? { ...item, ...options, type: options.type ?? item.type } : item))
	);
	const timeout = options.timeout ?? ((options.type ?? 'default') === 'loading' ? 0 : DEFAULT_TIMEOUT);
	schedule(id, timeout);
}

function close(id: number): void {
	clearTimer(id);
	toasts.update((items) => items.filter((item) => item.id !== id));
}

/** Swaps one toast through loading -> settled rather than stacking three. */
async function promise<T>(
	work: Promise<T>,
	messages: {
		loading: string;
		success: string | ((value: T) => string);
		error: string | ((reason: unknown) => string);
	}
): Promise<T> {
	const id = add({ title: messages.loading, type: 'loading' });
	try {
		const value = await work;
		const success = messages.success;
		update(id, { title: typeof success === 'function' ? success(value) : success, type: 'success' });
		return value;
	} catch (reason) {
		const error = messages.error;
		update(id, { title: typeof error === 'function' ? error(reason) : error, type: 'error' });
		throw reason;
	}
}

type Legacy = { description?: string; actionProps?: ToastAction; timeout?: number };
const legacy = (type: ToastType) => (title: string, options: Legacy = {}) =>
	add({ ...options, title, type });

export const toast = Object.assign(
	(title: string, options: Legacy & { type?: ToastType } = {}) => add({ ...options, title }),
	{
		add,
		update,
		close,
		promise,
		pause,
		resume,
		success: legacy('success'),
		error: legacy('error'),
		warning: legacy('warning'),
		info: legacy('info'),
		loading: legacy('loading'),
		dismiss: close
	}
);
