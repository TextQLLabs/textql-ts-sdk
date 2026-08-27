import { mount, unmount } from 'svelte';
import Confirm from './Confirm.svelte';
import type { ConfirmOptions } from './types';

export function confirm(options: ConfirmOptions = {}): Promise<boolean> {
	if (typeof document === 'undefined') return Promise.resolve(false);
	return new Promise((resolve) => {
		const target = document.createElement('div');
		document.body.appendChild(target);
		let settled = false;
		let component: ReturnType<typeof mount>;
		const finish = (result: boolean) => {
			if (settled) return;
			settled = true;
			queueMicrotask(async () => { await unmount(component); target.remove(); });
			resolve(result);
		};
		component = mount(Confirm, { target, props: { ...options, open: true, onConfirm: () => finish(true), onCancel: () => finish(false) } });
	});
}
