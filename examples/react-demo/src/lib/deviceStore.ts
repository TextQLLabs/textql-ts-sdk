import { Store, useStore } from './store';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const breakpoints: Record<Breakpoint, number> = {
	xs: 0,
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536
};

const getInitialBreakpoint = (): Breakpoint => {
	if (typeof window === 'undefined') return 'md';
	let active: Breakpoint = 'xs';
	for (const [name, width] of Object.entries(breakpoints)) {
		if (name === 'xs') continue;
		if (window.matchMedia(`(min-width: ${width}px)`).matches) {
			active = name as Breakpoint;
		}
	}
	return active;
};

export type ScrollDirection = 'up' | 'down';

class DeviceStore extends Store<{ breakpoint: Breakpoint; scrollDirection: ScrollDirection }> {
	constructor() {
		super({ breakpoint: getInitialBreakpoint(), scrollDirection: 'down' });
	}

	setBreakpoint(breakpoint: Breakpoint) {
		this.set({ breakpoint });
	}

	setScrollDirection(scrollDirection: ScrollDirection) {
		this.set({ scrollDirection });
	}
}

export const deviceStore = new DeviceStore();

export function deviceTypeFor(bp: Breakpoint): DeviceType {
	if (bp === 'xs' || bp === 'sm') return 'mobile';
	if (bp === 'md' || bp === 'lg') return 'tablet';
	return 'desktop';
}

export function useDeviceType(): DeviceType {
	return deviceTypeFor(useStore(deviceStore).breakpoint);
}

export function useScrollDirection(): ScrollDirection {
	return useStore(deviceStore).scrollDirection;
}

let scrollListenerInitialized = false;

export const initScrollListener = () => {
	if (scrollListenerInitialized || typeof window === 'undefined') return () => {};
	scrollListenerInitialized = true;

	let lastY = window.scrollY;
	const onScroll = () => {
		const y = Math.max(0, window.scrollY);
		if (Math.abs(y - lastY) < 6) return; // ignore jitter
		deviceStore.setScrollDirection(y < lastY ? 'up' : 'down');
		lastY = y;
	};
	window.addEventListener('scroll', onScroll, { passive: true });

	return () => {
		window.removeEventListener('scroll', onScroll);
		scrollListenerInitialized = false;
	};
};

let listenerInitialized = false;

export const initBreakpointListener = () => {
	if (listenerInitialized || typeof window === 'undefined') return () => {};
	listenerInitialized = true;

	const queries = Object.entries(breakpoints)
		.filter(([name]) => name !== 'xs')
		.map(([name, width]) => ({
			name: name as Breakpoint,
			query: window.matchMedia(`(min-width: ${width}px)`)
		}));

	const update = () => {
		let active: Breakpoint = 'xs';
		for (const { name, query } of queries) {
			if (query.matches) active = name;
		}
		deviceStore.setBreakpoint(active);
	};

	update();

	for (const { query } of queries) {
		query.addEventListener('change', update);
	}

	return () => {
		for (const { query } of queries) {
			query.removeEventListener('change', update);
		}
		listenerInitialized = false;
	};
};
