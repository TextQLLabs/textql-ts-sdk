import { createContext, useContext, type ReactNode } from 'react';

import { cx } from '../lib/cx';
import type { IconComponent } from '../lib/icon';

export type View = { value: string; label: string; icon?: IconComponent };

type SwitcherContext = {
	views: View[];
	value: string;
	setValue: (value: string) => void;
};

const Context = createContext<SwitcherContext | null>(null);

function useSwitcher(part: string): SwitcherContext {
	const context = useContext(Context);
	if (!context) throw new Error(`<${part}> must be rendered inside <ViewSwitcher>`);
	return context;
}

type RootProps = {
	views: View[];
	value: string;
	onValueChange: (value: string) => void;
	children?: ReactNode;
};

/** Holds the selection. Renders no DOM of its own. */
export function ViewSwitcher({ views, value, onValueChange, children }: RootProps) {
	return (
		<Context.Provider value={{ views, value, setValue: onValueChange }}>{children}</Context.Provider>
	);
}

const TRACK = 'inline-flex items-center gap-0.5 rounded-sm bg-track p-0.5';
const ITEM =
	'inline-flex cursor-pointer items-center gap-1.5 rounded-sm border-0 px-2 py-[3px] font-medium transition-colors duration-[0.12s]';
/** Idle sits on the track, so `text-muted` (~3:1) disappears. */
const ITEM_OFF = 'bg-transparent text-text-3 hover:bg-ink/8 hover:text-ink';
/** Inverted chip. Kept off ITEM_OFF's class string so `bg-transparent` cannot
 *  beat `bg-ink` — `cx` does not resolve Tailwind conflicts. */
const ITEM_ON = 'bg-ink text-paper hover:bg-ink hover:text-paper';

export function ViewSwitcherItem({ view, className }: { view: View; className?: string }) {
	const { value, setValue } = useSwitcher('ViewSwitcherItem');
	const active = value === view.value;
	const Icon = view.icon;

	return (
		<button
			type="button"
			className={cx(ITEM, active ? ITEM_ON : ITEM_OFF, className)}
			aria-pressed={active}
			onClick={() => setValue(view.value)}
		>
			{Icon && <Icon className="shrink-0" size={13} />}
			{view.label}
		</button>
	);
}

/** The track with every view as a segment. Inherits type size from its container. */
export function ViewSwitcherList({ className }: { className?: string }) {
	const { views } = useSwitcher('ViewSwitcherList');
	if (views.length < 2) return null;

	return (
		<span className={cx(TRACK, className)} role="group" aria-label="View">
			{views.map((view) => (
				<ViewSwitcherItem key={view.value} view={view} />
			))}
		</span>
	);
}

export function ViewSwitcherPanel({
	value,
	children
}: {
	value: string;
	children: ReactNode;
}) {
	const context = useSwitcher('ViewSwitcherPanel');
	if (context.value !== value) return null;
	return <>{children}</>;
}
