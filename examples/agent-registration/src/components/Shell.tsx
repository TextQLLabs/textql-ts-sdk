import { ClipboardList, Moon, PlusSquare, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

import { cx } from '../lib/cx';
import { useTheme } from '../lib/theme';

const NAV = [
	{ to: '/', label: 'Register an agent', icon: PlusSquare },
	{ to: '/registrations', label: 'Registrations', icon: ClipboardList }
];

export function Shell({ children }: { children: ReactNode }) {
	const { theme, toggle } = useTheme();

	return (
		<div className="flex h-screen min-h-0 bg-paper text-ink max-[720px]:flex-col">
			<aside className="flex w-56 shrink-0 flex-col gap-6 border-r border-line/80 bg-sidebar px-3 py-4 max-[720px]:w-full max-[720px]:flex-row max-[720px]:items-center max-[720px]:gap-3 max-[720px]:border-r-0 max-[720px]:border-b max-[720px]:py-2">
				<div className="flex flex-col gap-0.5 px-2">
					<span className="font-pixel text-[15px] tracking-tight text-ink">Agent Registry</span>
					<span className="font-mono text-[10.5px] tracking-wider text-muted uppercase max-[720px]:hidden">
						Governed onboarding
					</span>
				</div>

				<nav className="flex flex-col gap-0.5 max-[720px]:flex-row">
					{NAV.map(({ to, label, icon: Icon }) => (
						<NavLink
							key={to}
							to={to}
							end
							className={({ isActive }) =>
								cx(
									'flex items-center gap-2 rounded-sm px-2 py-1.5 text-[12.5px] no-underline transition-colors',
									isActive
										? 'bg-elevate text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_75%,transparent)]'
										: 'text-text-3 hover:bg-elevate/60 hover:text-ink'
								)
							}
						>
							<Icon size={14} strokeWidth={1.75} />
							<span className="max-[720px]:hidden">{label}</span>
						</NavLink>
					))}
				</nav>

				<button
					type="button"
					onClick={toggle}
					aria-label={theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
					className="mt-auto flex cursor-pointer items-center gap-2 rounded-sm border-0 bg-transparent px-2 py-1.5 text-[12px] text-muted transition-colors hover:bg-elevate/60 hover:text-ink max-[720px]:mt-0 max-[720px]:ml-auto"
				>
					{theme === 'dark' ? <Sun size={14} strokeWidth={1.75} /> : <Moon size={14} strokeWidth={1.75} />}
					<span className="max-[720px]:hidden">{theme === 'dark' ? 'Light' : 'Dark'} theme</span>
				</button>
			</aside>

			<main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
		</div>
	);
}
