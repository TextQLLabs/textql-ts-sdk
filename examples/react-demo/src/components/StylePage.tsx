import { useState } from 'react';

import { usePageTitle } from '../lib/usePageTitle';
import {
	Button,
	Confirm,
	Marquee,
	Modal,
	Page,
	Switch,
	Text,
	confirm,
	toast,
	type TextColor,
	type TextSize,
	type TextType
} from '../primitives';

const buttonVariants = ['solid', 'classic', 'soft', 'surface', 'outline', 'ghost'] as const;
const buttonSizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const textSizes: TextSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'];
const textColors: TextColor[] = ['black', 'muted', 'accent'];
const textTypes: TextType[] = ['paragraph', 'label', 'heading', 'important'];

const TOC_LINK =
	'font-mono text-[0.75rem] text-accent no-underline hover:underline hover:underline-offset-[3px]';

const CARD =
	'flex flex-col gap-5 border border-line px-[1.35rem] pt-5 pb-[1.4rem] rounded-lg bg-[color-mix(in_srgb,var(--color-paper)_88%,white)] shadow-[0_1px_0_rgba(255,255,255,0.7)_inset]';

const CARD_HEAD_TITLE = 'm-0 text-[1.05rem] font-[560] -tracking-[0.01em] text-ink';
const CARD_HEAD_TEXT = 'mt-[0.35rem] mb-0 text-[0.8125rem] leading-[1.5] text-muted';
/** `.card-head code` / `.api-list code` — inline code chip. */
const CODE = 'font-mono text-[0.78em] px-[0.3em] py-[0.05em] rounded-[4px] bg-sidebar text-ink';

/**
 * `.subhead` — the `code` overrides come from `.subhead code`, which only resets
 * size/case/tracking (it is not the `.card-head code` chip).
 */
const SUBHEAD =
	'mb-[0.6rem] font-mono text-[0.6875rem] font-medium tracking-[0.06em] text-muted uppercase [&_code]:text-[0.9em] [&_code]:normal-case [&_code]:tracking-[0]';
/** `.subhead:first-of-type` — tighter top margin on the first one in a card. */
const SUBHEAD_FIRST = `mt-[0.6rem] ${SUBHEAD}`;
const SUBHEAD_NEXT = `mt-[1.1rem] ${SUBHEAD}`;

const BLOCK = 'flex flex-col gap-[0.65rem]';
const BLOCK_LABEL =
	'm-0 font-mono text-[0.6875rem] font-medium tracking-[0.06em] text-muted uppercase';

/** `.row` — `align-items` is picked exclusively so the two never collide. */
const ROW_BASE = 'flex flex-wrap gap-2';
const ROW = `${ROW_BASE} items-center`;
const ROW_END = `${ROW_BASE} items-end`;

const STACK = 'flex flex-col gap-[0.55rem]';
const MATRIX_ROW =
	'grid grid-cols-[4.5rem_1fr] items-end gap-3 max-[640px]:grid-cols-1 max-[640px]:gap-[0.35rem]';
const MATRIX_LABEL = 'font-mono text-[0.6875rem] text-muted pb-[0.35rem]';
const SAMPLE_ROW =
	'grid grid-cols-[5.5rem_1fr] items-baseline gap-3 max-[640px]:grid-cols-1 max-[640px]:gap-[0.35rem]';
const SAMPLE_META = 'font-mono text-[0.6875rem] text-muted';

const HINT = 'm-0 text-[0.75rem] text-muted';
const SWITCH_LABEL =
	'inline-flex cursor-pointer items-center gap-2 font-mono text-[0.75rem] text-ink';

/** `.marquee-frame` / `.marquee-frame.narrow` — only `max-width` differs. */
const MARQUEE_FRAME =
	'w-full px-[0.9rem] py-3 border border-line rounded-md bg-sidebar font-mono text-[0.8125rem] text-ink';
const MARQUEE_FRAME_WIDE = `${MARQUEE_FRAME} max-w-[28rem]`;
const MARQUEE_FRAME_NARROW = `${MARQUEE_FRAME} max-w-[12rem]`;

/** `.api-list strong` */
const API_TERM = 'font-[550] text-ink';

export function StylePage() {
	usePageTitle('Style guide · chat-demo');

	const [switchOn, setSwitchOn] = useState(true);
	const [switchOff, setSwitchOff] = useState(false);
	const [modalOpen, setModalOpen] = useState(false);
	const [scrambleKey, setScrambleKey] = useState(0);

	// Confirm dialog demo state
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	async function runImperativeConfirm(tone: 'danger' | 'warning' | 'info') {
		const ok = await confirm({
			tone,
			title: tone === 'danger' ? 'Delete thread?' : 'Are you sure?',
			description:
				tone === 'danger'
					? 'This permanently deletes the thread and all of its messages. This cannot be undone.'
					: 'Please confirm you want to continue with this action.',
			confirmLabel: tone === 'danger' ? 'Delete' : 'Continue'
		});
		toast[ok ? 'success' : 'error'](ok ? 'Confirmed' : 'Cancelled');
	}

	async function confirmDelete() {
		// Simulate async work while the dialog stays open in a loading state.
		setDeleting(true);
		await new Promise((r) => setTimeout(r, 1200));
		setDeleting(false);
		setConfirmOpen(false);
		toast.success('Thread deleted');
	}

	function demoPromiseToast() {
		const work = new Promise<{ name: string }>((resolve, reject) =>
			setTimeout(() => (Math.random() > 0.3 ? resolve({ name: 'report.csv' }) : reject()), 1500)
		);
		toast.promise(work, {
			loading: 'Exporting…',
			success: (data: { name: string }) => `Exported ${data.name}`,
			error: 'Export failed'
		});
	}

	function demoActionToast() {
		toast('Thread archived', {
			description: 'You can restore it from the archive.',
			action: { label: 'Undo', onClick: () => toast.success('Restored') }
		});
	}

	return (
		<div className="min-h-dvh">
			<Page
				title="Style guide"
				lead="Inventory of UI primitives — variants, sizes, and interactive states."
				actions={
					<a
						className="text-[13px] font-medium text-text-3 no-underline hover:text-ink"
						href="/"
					>
						← Chat demo
					</a>
				}
			>
				<div className="flex flex-col gap-5">
					<nav
						className="flex flex-wrap gap-x-[0.85rem] gap-y-[0.35rem] border-b border-line pb-[0.85rem]"
						aria-label="On this page"
					>
						<a className={TOC_LINK} href="#button">
							Button
						</a>
						<a className={TOC_LINK} href="#text">
							Text
						</a>
						<a className={TOC_LINK} href="#switch">
							Switch
						</a>
						<a className={TOC_LINK} href="#modal">
							Modal
						</a>
						<a className={TOC_LINK} href="#confirm">
							Confirm
						</a>
						<a className={TOC_LINK} href="#toaster">
							Toaster
						</a>
						<a className={TOC_LINK} href="#marquee">
							Marquee
						</a>
						<a className={TOC_LINK} href="#page">
							Page
						</a>
						<a className={TOC_LINK} href="#layout">
							Layout
						</a>
					</nav>

					<section id="button" className={CARD}>
						<div>
							<h2 className={CARD_HEAD_TITLE}>Button</h2>
							<p className={CARD_HEAD_TEXT}>
								Variants × sizes, disabled, and link (<code className={CODE}>href</code>) rendering.
							</p>
						</div>

						<div className={BLOCK}>
							<h3 className={BLOCK_LABEL}>Variants</h3>
							<div className={ROW}>
								{buttonVariants.map((variant) => (
									<Button key={variant} variant={variant}>
										{variant}
									</Button>
								))}
							</div>
						</div>

						<div className={BLOCK}>
							<h3 className={BLOCK_LABEL}>Sizes</h3>
							<div className={ROW_END}>
								{buttonSizes.map((size) => (
									<Button key={size} size={size}>
										{size}
									</Button>
								))}
							</div>
						</div>

						<div className={BLOCK}>
							<h3 className={BLOCK_LABEL}>Matrix</h3>
							<div className="flex flex-col gap-3">
								{buttonVariants.map((variant) => (
									<div className={MATRIX_ROW} key={variant}>
										<span className={MATRIX_LABEL}>{variant}</span>
										<div className={ROW_END}>
											{buttonSizes.map((size) => (
												<Button key={size} variant={variant} size={size}>
													{size}
												</Button>
											))}
										</div>
									</div>
								))}
							</div>
						</div>

						<div className={BLOCK}>
							<h3 className={BLOCK_LABEL}>States &amp; link</h3>
							<div className={ROW}>
								<Button disabled>Disabled solid</Button>
								<Button variant="outline" disabled>
									Disabled outline
								</Button>
								<Button variant="ghost" disabled>
									Disabled ghost
								</Button>
								<Button href="/">Link to home</Button>
								<Button href="/" variant="soft">
									Soft link
								</Button>
							</div>
						</div>
					</section>

					<section id="text" className={CARD}>
						<div>
							<h2 className={CARD_HEAD_TITLE}>Text</h2>
							<p className={CARD_HEAD_TEXT}>
								Sizes, colors, types, and optional scramble animation.
							</p>
						</div>

						<div className={BLOCK}>
							<h3 className={BLOCK_LABEL}>Sizes</h3>
							<div className={STACK}>
								{textSizes.map((size) => (
									<div className={SAMPLE_ROW} key={size}>
										<span className={SAMPLE_META}>{size}</span>
										<Text size={size}>The quick brown fox jumps over the lazy dog.</Text>
									</div>
								))}
							</div>
						</div>

						<div className={BLOCK}>
							<h3 className={BLOCK_LABEL}>Colors</h3>
							<div className={ROW}>
								{textColors.map((color) => (
									<Text key={color} color={color} size="md">
										{color}
									</Text>
								))}
								<span className="inline-flex items-center rounded-sm bg-ink px-[0.65rem] py-[0.35rem]">
									<Text color="white" size="md">
										white
									</Text>
								</span>
							</div>
						</div>

						<div className={BLOCK}>
							<h3 className={BLOCK_LABEL}>Types</h3>
							<div className={STACK}>
								{textTypes.map((type) => (
									<div className={SAMPLE_ROW} key={type}>
										<span className={SAMPLE_META}>{type}</span>
										<Text type={type} size={type === 'heading' || type === 'important' ? 'xl' : 'md'}>
											{type === 'label' ? 'Section label' : `Sample ${type} text`}
										</Text>
									</div>
								))}
							</div>
						</div>

						<div className={BLOCK}>
							<h3 className={BLOCK_LABEL}>Animate</h3>
							<div className={ROW}>
								<Text key={scrambleKey} type="heading" size="xl" animate duration={900}>
									Scramble on mount
								</Text>
								<Button variant="outline" size="sm" onClick={() => setScrambleKey((k) => k + 1)}>
									Replay
								</Button>
							</div>
							<p className={HINT}>Hover the line below to re-scramble.</p>
							<Text type="heading" size="lg" animateOnHover>
								Hover to scramble
							</Text>
						</div>
					</section>

					<section id="switch" className={CARD}>
						<div>
							<h2 className={CARD_HEAD_TITLE}>Switch</h2>
							<p className={CARD_HEAD_TEXT}>
								Controlled on/off state; disabled when interaction should be locked.
							</p>
						</div>
						<div className={ROW}>
							<label className={SWITCH_LABEL}>
								<span>On</span>
								<Switch checked={switchOn} onCheckedChange={setSwitchOn} />
							</label>
							<label className={SWITCH_LABEL}>
								<span>Off</span>
								<Switch checked={switchOff} onCheckedChange={setSwitchOff} />
							</label>
							<label className={SWITCH_LABEL}>
								<span>Disabled on</span>
								<Switch checked disabled />
							</label>
							<label className={SWITCH_LABEL}>
								<span>Disabled off</span>
								<Switch checked={false} disabled />
							</label>
						</div>
						<p className={HINT}>
							Live: on={String(switchOn)} · off={String(switchOff)}
						</p>
					</section>

					<section id="modal" className={CARD}>
						<div>
							<h2 className={CARD_HEAD_TITLE}>Modal</h2>
							<p className={CARD_HEAD_TEXT}>
								Dialog with title, body, and action row. Backdrop / Escape dismiss by default.
							</p>
						</div>
						<Button variant="solid" onClick={() => setModalOpen(true)}>
							Open sample modal
						</Button>

						<Modal
							open={modalOpen}
							onOpenChange={setModalOpen}
							title="Confirm action"
							actions={
								<>
									<Button variant="ghost" onClick={() => setModalOpen(false)}>
										Cancel
									</Button>
									<Button
										variant="solid"
										onClick={() => {
											setModalOpen(false);
											toast.success('Confirmed');
										}}
									>
										Confirm
									</Button>
								</>
							}
						>
							<p>
								This is sample modal body copy. Use the actions prop for dismiss + primary buttons
								(dismiss first, primary last).
							</p>
						</Modal>
					</section>

					<section id="confirm" className={CARD}>
						<div>
							<h2 className={CARD_HEAD_TITLE}>Confirm</h2>
							<p className={CARD_HEAD_TEXT}>
								Confirmation dialog built on <code className={CODE}>Modal</code>. Comes in tones (
								<code className={CODE}>danger</code>, <code className={CODE}>warning</code>,{' '}
								<code className={CODE}>info</code>) for deletes and other guarded actions. Use the
								imperative <code className={CODE}>confirm()</code> for one-liners, or the{' '}
								<code className={CODE}>&lt;Confirm&gt;</code> component when you need an async loading
								state.
							</p>
						</div>

						<h3 className={SUBHEAD_FIRST}>
							Imperative — <code>await confirm(...)</code>
						</h3>
						<div className={ROW}>
							<Button variant="danger" onClick={() => runImperativeConfirm('danger')}>
								Delete…
							</Button>
							<Button variant="surface" onClick={() => runImperativeConfirm('warning')}>
								Warning…
							</Button>
							<Button variant="surface" onClick={() => runImperativeConfirm('info')}>
								Info…
							</Button>
						</div>

						<h3 className={SUBHEAD_NEXT}>Component — with async loading state</h3>
						<div className={ROW}>
							<Button variant="danger-soft" onClick={() => setConfirmOpen(true)}>
								Delete thread…
							</Button>
						</div>

						<Confirm
							open={confirmOpen}
							onOpenChange={setConfirmOpen}
							loading={deleting}
							tone="danger"
							title="Delete thread?"
							description="This permanently deletes the thread and all of its messages. This cannot be undone."
							confirmLabel="Delete"
							onConfirm={confirmDelete}
						/>
					</section>

					<section id="toaster" className={CARD}>
						<div>
							<h2 className={CARD_HEAD_TITLE}>Toaster</h2>
							<p className={CARD_HEAD_TEXT}>
								<code className={CODE}>Toaster</code> mounts a Sonner host;{' '}
								<code className={CODE}>toast</code> is re-exported from{' '}
								<code className={CODE}>../primitives</code>.
							</p>
						</div>
						<h3 className={SUBHEAD_FIRST}>
							Types — <code>richColors</code> maps each to a tone
						</h3>
						<div className={ROW}>
							<Button variant="soft" onClick={() => toast('Default toast')}>
								Default
							</Button>
							<Button variant="soft" onClick={() => toast.success('Saved successfully')}>
								Success
							</Button>
							<Button variant="soft" onClick={() => toast.error('Something went wrong')}>
								Error
							</Button>
							<Button variant="soft" onClick={() => toast.warning('Double-check before continuing')}>
								Warning
							</Button>
							<Button variant="soft" onClick={() => toast.info('Heads up — new data available')}>
								Info
							</Button>
							<Button variant="soft" onClick={() => toast.loading('Working…')}>
								Loading
							</Button>
						</div>

						<h3 className={SUBHEAD_NEXT}>Composition — description, action, and promise</h3>
						<div className={ROW}>
							<Button
								variant="soft"
								onClick={() =>
									toast('With description', {
										description: 'Optional secondary line for context.'
									})
								}
							>
								With description
							</Button>
							<Button variant="soft" onClick={demoActionToast}>
								With action
							</Button>
							<Button variant="soft" onClick={demoPromiseToast}>
								Promise (async)
							</Button>
						</div>
					</section>

					<section id="marquee" className={CARD}>
						<div>
							<h2 className={CARD_HEAD_TITLE}>Marquee</h2>
							<p className={CARD_HEAD_TEXT}>
								Horizontal scroll when text overflows the container; centers when it fits.
							</p>
						</div>
						<div className={MARQUEE_FRAME_WIDE}>
							<Marquee
								text="Streaming status · analyzing datasets · waiting for input · tool sequence complete · "
								speed={48}
								gap={40}
							/>
						</div>
						<div className={MARQUEE_FRAME_NARROW}>
							<Marquee text="Fits — centered" center speed={40} />
						</div>
					</section>

					<section id="page" className={CARD}>
						<div>
							<h2 className={CARD_HEAD_TITLE}>Page</h2>
							<p className={CARD_HEAD_TEXT}>
								App page shell: full-bleed header (title, optional lead, optional actions with
								space-between) + max-width body. Works embedded in the chat shell or standalone — not
								mounted here to avoid nesting another full-height frame.
							</p>
						</div>
						<div className="flex flex-col gap-[0.85rem]">
							<pre className="m-0 overflow-x-auto whitespace-pre rounded-md border border-line bg-sidebar px-4 py-[0.9rem] font-mono text-[0.75rem] leading-[1.55] text-ink">{`<Page
  title="Playbooks"
  lead="Optional supporting line."
  wide={false}
  actions={<button type="button">New playbook</button>}
>
  {/* body */}
</Page>`}</pre>
							<ul className="m-0 pl-[1.1rem] text-[0.8125rem] leading-[1.55] text-muted">
								<li>
									<strong className={API_TERM}>title</strong> — required page heading
								</li>
								<li>
									<strong className={API_TERM}>lead</strong> — muted supporting sentence under the
									title
								</li>
								<li>
									<strong className={API_TERM}>actions</strong> — node for header-right controls
								</li>
								<li>
									<strong className={API_TERM}>children</strong> — body content in a centered 840px
									column
								</li>
								<li>
									<strong className={API_TERM}>wide</strong> — full-width body/header (e.g. ontology)
								</li>
								<li>
									<strong className={API_TERM}>className</strong> — optional class on the root
								</li>
							</ul>
						</div>
					</section>

					<section id="layout" className={CARD}>
						<div>
							<h2 className={CARD_HEAD_TITLE}>Layout</h2>
							<p className={CARD_HEAD_TEXT}>
								App chrome: desktop sidebar nav + mobile top bar, breakpoint / scroll listeners,
								optional debug overlay. Shell-only — skip mounting on this inventory page.
							</p>
						</div>
						<div className="flex flex-col gap-[0.85rem]">
							<pre className="m-0 overflow-x-auto whitespace-pre rounded-md border border-line bg-sidebar px-4 py-[0.9rem] font-mono text-[0.75rem] leading-[1.55] text-ink">{`<Layout path={useLocation().pathname}>
  {children}
</Layout>`}</pre>
							<ul className="m-0 pl-[1.1rem] text-[0.8125rem] leading-[1.55] text-muted">
								<li>
									<strong className={API_TERM}>path</strong> — active route for nav highlight
								</li>
								<li>
									Links: home, blog; components when <code className={CODE}>?debug</code>
								</li>
								<li>
									Wraps route content; pair with <code className={CODE}>Page</code> inside children
								</li>
							</ul>
						</div>
					</section>
				</div>
			</Page>
		</div>
	);
}
