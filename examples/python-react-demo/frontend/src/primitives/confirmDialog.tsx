import { createRoot } from 'react-dom/client';

import { Confirm } from './Confirm';
import type { ConfirmOptions } from './modalTypes';

/**
 * Imperatively ask the user to confirm an action. Resolves `true` if they
 * confirm, `false` if they cancel/dismiss. Mounts its own dialog, so no host
 * component is required.
 *
 * @example
 *   if (!(await confirm({ title: "Close thread?" }))) return;
 *   await api.close(id);
 */
export function confirm(options: ConfirmOptions = {}): Promise<boolean> {
	// Guard against SSR — confirmations are inherently interactive.
	if (typeof document === 'undefined') return Promise.resolve(false);

	return new Promise((resolve) => {
		const target = document.createElement('div');
		document.body.appendChild(target);
		const root = createRoot(target);

		let settled = false;

		const finish = (result: boolean) => {
			if (settled) return;
			settled = true;
			// Unmount outside the React commit phase, then drop the mount point.
			queueMicrotask(() => {
				root.unmount();
				target.remove();
			});
			resolve(result);
		};

		root.render(
			<Confirm {...options} onConfirm={() => finish(true)} onCancel={() => finish(false)} />
		);
	});
}
