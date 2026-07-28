import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';

import { debugStore, useDebug } from '../lib/debugStore';
import { initBreakpointListener, initScrollListener, useDeviceType } from '../lib/deviceStore';
import { isDebugEnabled } from '../lib/utils';
import { Debug } from './Debug';
import { Text } from './Text';

interface Props {
	children?: ReactNode;
	/** Active route, used to highlight the matching nav link. */
	path: string;
}

const isBlogPath = (p: string) => p === '/blog' || p.startsWith('/blog/');

export function Layout({ children, path }: Props) {
	const debug = useDebug();
	const deviceType = useDeviceType();

	const homeLink = useRef<HTMLAnchorElement>(null);
	const blogLink = useRef<HTMLAnchorElement>(null);
	const componentsLink = useRef<HTMLAnchorElement>(null);
	const navEl = useRef<HTMLElement>(null);
	const [indicatorStyle, setIndicatorStyle] = useState({ top: '0px', height: '0px' });

	// Slide the accent bar to whichever link the current path activates. Measured
	// rather than derived so it survives the links appearing/disappearing with ?debug.
	useLayoutEffect(() => {
		const activeLink =
			path === '/' ? homeLink.current : isBlogPath(path) ? blogLink.current : componentsLink.current;

		if (activeLink && navEl.current) {
			const linkRect = activeLink.getBoundingClientRect();
			const navRect = navEl.current.getBoundingClientRect();
			setIndicatorStyle({
				top: `${linkRect.top - navRect.top}px`,
				height: `${linkRect.height}px`
			});
		}
	}, [path, debug, deviceType]);

	useEffect(() => {
		const onPop = () => debugStore.setEnabled(isDebugEnabled());
		window.addEventListener('popstate', onPop);
		return () => window.removeEventListener('popstate', onPop);
	}, []);

	useEffect(() => {
		const stopBreakpoints = initBreakpointListener();
		const stopScroll = initScrollListener();
		return () => {
			stopBreakpoints();
			stopScroll();
		};
	}, []);

	return (
		<>
			{debug && <Debug />}

			<div className="relative z-[1] min-h-screen">
				{deviceType === 'desktop' ? (
					<aside className="fixed top-0 left-[12.5%] z-10 h-screen w-[12.5%] px-4 py-20">
						{/* Hairline rule that draws itself downward, with a highlight sweeping past once. */}
						<div
							className="pointer-events-none absolute top-0 right-0 h-[64%] w-px overflow-hidden"
							aria-hidden="true"
						>
							<div className="absolute inset-0 origin-top scale-y-0 animate-rule-draw bg-[linear-gradient(to_bottom,var(--color-line)_0%,var(--color-line)_45%,transparent_100%)] motion-reduce:scale-y-100 motion-reduce:animate-none" />
							<div className="absolute left-[-0.5px] h-[28%] w-[2px] -translate-y-[120%] animate-rule-shine bg-[linear-gradient(to_bottom,transparent_0%,color-mix(in_srgb,var(--color-accent)_35%,white)_42%,color-mix(in_srgb,var(--color-accent)_55%,white)_55%,transparent_100%)] opacity-0 blur-[0.3px] motion-reduce:animate-none" />
						</div>

						<nav ref={navEl} className="relative flex flex-col gap-0 text-right">
							<div
								className="absolute -right-3 top-0 w-0.5 bg-accent transition-all duration-300 ease-out"
								style={indicatorStyle}
							/>

							<Text
								type="paragraph"
								size="sm"
								color={path === '/' ? 'accent' : 'black'}
								links={path !== '/'}
								className="w-full"
							>
								<a ref={homeLink} href="/" className={path === '/' ? 'no-underline' : ''}>
									home
								</a>
							</Text>

							<Text
								type="paragraph"
								size="sm"
								color={isBlogPath(path) ? 'accent' : 'black'}
								links={!isBlogPath(path)}
								className="w-full"
							>
								<a ref={blogLink} href="/blog" className={isBlogPath(path) ? 'no-underline' : ''}>
									blog
								</a>
							</Text>

							{debug && (
								<Text
									type="paragraph"
									size="sm"
									color={path === '/xyz' ? 'accent' : 'black'}
									links={path !== '/xyz'}
									className="w-full"
								>
									<a ref={componentsLink} href="/xyz" className={path === '/xyz' ? 'no-underline' : ''}>
										components
									</a>
								</Text>
							)}
						</nav>
					</aside>
				) : (
					<nav className="fixed top-0 right-0 left-0 z-10 flex items-center justify-between border-b border-line bg-paper/95 px-4 py-4 backdrop-blur">
						<div className="flex items-center gap-4">
							<Text
								type="paragraph"
								size="sm"
								color={path === '/' ? 'accent' : 'black'}
								links={path !== '/'}
							>
								<a href="/" className={path === '/' ? 'no-underline' : ''}>
									home
								</a>
							</Text>

							<Text
								type="paragraph"
								size="sm"
								color={isBlogPath(path) ? 'accent' : 'black'}
								links={!isBlogPath(path)}
							>
								<a href="/blog" className={isBlogPath(path) ? 'no-underline' : ''}>
									blog
								</a>
							</Text>

							{debug && (
								<Text
									type="paragraph"
									size="sm"
									color={path === '/xyz' ? 'accent' : 'black'}
									links={path !== '/xyz'}
								>
									<a href="/xyz" className={path === '/xyz' ? 'no-underline' : ''}>
										components
									</a>
								</Text>
							)}
						</div>
					</nav>
				)}

				<div className={deviceType === 'desktop' ? 'relative pt-0' : 'relative pt-16'}>{children}</div>
			</div>
		</>
	);
}
