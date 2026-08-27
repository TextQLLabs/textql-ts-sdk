/**
 * One place where every write in this app announces itself.
 *
 * Each server action already returns `{ message }` on success and
 * `fail(400, { message })` on failure, so the outcome is unambiguous on the
 * client. This wraps that in `use:enhance` so a mutation:
 *
 *   - marks itself pending (a key, so a page with many switches can show a
 *     spinner on the one that was actually clicked),
 *   - toasts on *both* outcomes — a silent success is as confusing as a silent
 *     failure,
 *   - re-reads the org through `invalidateAll` so what's on screen is the
 *     server's state, not an optimistic guess.
 */
import { applyAction } from '$app/forms';
import { invalidateAll } from '$app/navigation';
import type { SubmitFunction } from '@sveltejs/kit';

import { toast } from '$lib/primitives';

/**
 * How many writes are in flight app-wide. `invalidateAll` does not populate
 * SvelteKit's `navigating`, so the layout's progress bar reads this to cover
 * mutations as well as route changes.
 */
let inFlight = $state(0);
export const mutations = {
	get busy(): boolean {
		return inFlight > 0;
	}
};

/** Tracks which mutation is in flight so a page can spin the right control. */
export class MutationTracker {
	#key = $state<string | null>(null);

	get busy(): boolean {
		return this.#key !== null;
	}

	is(key: string): boolean {
		return this.#key === key;
	}

	/**
	 * `key` identifies the control being submitted — a field name, a role id.
	 * `label` names the thing changed, and becomes the toast title.
	 *
	 * Pass a function when the label depends on reactive state. `use:enhance`
	 * builds its SubmitFunction once and never rebuilds it, so a string
	 * interpolated from `$state` freezes at whatever was selected on mount — the
	 * roles page happily reported "Save admin" while saving `member`.
	 */
	submit(key: string, label: string | (() => string)): SubmitFunction {
		const titleOf = () => (typeof label === 'string' ? label : label());
		return () => {
			this.#key = key;
			inFlight += 1;
			return async ({ result }) => {
				// The control stops spinning as soon as the write lands, but the
				// app-wide bar runs until the refetch below settles too.
				this.#key = null;

				const title = titleOf();
				if (result.type === 'success') {
					const message = messageOf(result.data);
					toast.success(title, message ? { description: message } : {});
					await invalidateAll();
				} else if (result.type === 'failure') {
					toast.error(`${title} failed`, {
						description: messageOf(result.data) ?? 'The API rejected the change.'
					});
				} else if (result.type === 'error') {
					toast.error(`${title} failed`, { description: result.error.message });
				}

				// Redirects and the form-scoped `form` prop still need the default
				// handling; only the toast + refetch above are ours.
				await applyAction(result);
				inFlight -= 1;
			};
		};
	}
}

function messageOf(data: Record<string, unknown> | undefined): string | undefined {
	const message = data?.message;
	return typeof message === 'string' && message ? message : undefined;
}
