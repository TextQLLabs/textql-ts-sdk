import { createContext, useContext, useState, type ReactNode } from 'react';

import type { IconComponent } from '../lib/cells';
import { cx } from '../lib/cx';

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
	/** Controlled. Omit for uncontrolled, which starts on `defaultValue` or the first view. */
	value?: string;
	defaultValue?: string;
	onValueChange?: (value: string) => void;
	children?: ReactNode;
};

/** Holds the selection. Renders no DOM of its own. */
export function ViewSwitcher({
	views,
	value,
	defaultValue,
	onValueChange,
	children
}: RootProps) {
	const [uncontrolled, setUncontrolled] = useState(defaultValue ?? views[0]?.value ?? '');
	const current = value ?? uncontrolled;

	function setValue(next: string) {
		if (value === undefined) setUncontrolled(next);
		onValueChange?.(next);
	}

	return <Context.Provider value={{ views, value: current, setValue }}>{children}</Context.Provider>;
}

const TRACK = 'inline-flex items-center gap-0.5 rounded-sm bg-track p-0.5';
const ITEM =
	'inline-flex cursor-pointer items-center gap-1.5 rounded-sm border-0 bg-transparent px-2 py-[3px] font-medium text-muted transition-colors duration-[0.12s] hover:bg-ink/8 hover:text-ink';
/** Inverted, not tinted. Every shade-of-the-track version of this — lighter
 *  chip, darker chip, border, shadow — topped out around 1.5:1 in dark mode and
 *  read as no selection at all. Ink-on-paper is ~12:1 in both themes. */
const ITEM_ON = 'bg-ink text-paper hover:bg-ink hover:text-paper';

export function ViewSwitcherItem({ view, className }: { view: View; className?: string }) {
	const { value, setValue } = useSwitcher('ViewSwitcherItem');
	const active = value === view.value;
	const Icon = view.icon;

	return (
		<button
			type="button"
			className={cx(ITEM, active && ITEM_ON, className)}
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
