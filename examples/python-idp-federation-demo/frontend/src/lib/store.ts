import { useSyncExternalStore } from 'react';

/**
 * Minimal observable used in place of Svelte's `$state` classes. Snapshots are
 * immutable so `useSyncExternalStore` can compare them by reference; mutate via
 * `set()` and read reactively in components with `useStore()`.
 */
export class Store<S extends object> {
	#state: S;
	#listeners = new Set<() => void>();

	constructor(initial: S) {
		this.#state = initial;
	}

	get state(): S {
		return this.#state;
	}

	protected set(patch: Partial<S> | ((current: S) => Partial<S>)): void {
		const next = typeof patch === 'function' ? patch(this.#state) : patch;
		let changed = false;
		for (const key of Object.keys(next) as (keyof S)[]) {
			if (!Object.is(this.#state[key], next[key])) {
				changed = true;
				break;
			}
		}
		if (!changed) return;
		this.#state = { ...this.#state, ...next };
		for (const listener of this.#listeners) listener();
	}

	subscribe = (listener: () => void): (() => void) => {
		this.#listeners.add(listener);
		return () => this.#listeners.delete(listener);
	};

	getSnapshot = (): S => this.#state;
}

export function useStore<S extends object>(store: Store<S>): S {
	return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
