import { ArrowUp, Boxes, Cable, Check, ChevronRight, Plus, X } from 'lucide-react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { CHAT_MODELS, DEFAULT_CHAT_MODEL } from '../lib/chatModels';
import { connectorIconSrc } from '../lib/connectorIcons';
import { connectorsCache, useConnectors } from '../lib/connectorsCache';
import { cx } from '../lib/cx';
import { useDismissable } from '../lib/useDismissable';

type Flyout = 'models' | 'connectors';

type Props = {
	value?: string;
	sending?: boolean;
	docked?: boolean;
	/** When true, model + connectors are read-only (existing chat). */
	configLocked?: boolean;
	selectedConnectorIds?: number[];
	selectedModel?: string;
	onValueChange?: (value: string) => void;
	onConnectorIdsChange?: (ids: number[]) => void;
	onModelChange?: (model: string) => void;
	onSend?: () => void;
	className?: string;
};

const ROOT_ITEMS = [
	{ id: 'models' as const, label: 'Models', Icon: Boxes },
	{ id: 'connectors' as const, label: 'Connectors', Icon: Cable }
];

const TEXTAREA_MAX_PX = 160;

const POPOVER =
	'overflow-hidden rounded-[12px] border border-[color-mix(in_srgb,var(--color-line)_90%,#d4d4d8)] bg-elevate shadow-[0_1px_2px_rgba(15,15,20,0.04),0_14px_32px_rgba(15,15,20,0.1)]';
const MENU_SECTION = 'flex flex-col p-0.5';
const MENU_ROW =
	'flex w-full items-center justify-between gap-2 rounded-[7px] px-2 py-1.5 text-left text-[12.5px] text-text-strong';
/** `flex-direction`/`gap` are set per variant so the two never collide. */
const MENU_ROW_MAIN = 'inline-flex min-w-0';
const CHECK_MARK = 'inline-flex shrink-0 items-center justify-center text-text-3';
const STATE_COPY = 'm-0 text-[11.5px] leading-[1.35] text-muted';

export function Composer({
	value = '',
	sending = false,
	docked = false,
	configLocked = false,
	selectedConnectorIds = [],
	selectedModel = DEFAULT_CHAT_MODEL as string,
	onValueChange,
	onConnectorIdsChange,
	onModelChange,
	onSend,
	className = ''
}: Props) {
	const connectors = useConnectors();
	const [menuOpen, setMenuOpen] = useState(false);
	const [flyout, setFlyout] = useState<Flyout | null>(null);
	const [connectorQuery, setConnectorQuery] = useState('');
	const menuRootRef = useRef<HTMLDivElement | null>(null);
	const textareaRef = useRef<HTMLTextAreaElement | null>(null);
	const searchRef = useRef<HTMLInputElement | null>(null);

	const normalizedConnectorQuery = connectorQuery.trim().toLowerCase();

	const filteredConnectors = connectors.connectors.filter((connector) => {
		if (!normalizedConnectorQuery) return true;
		return (
			connector.name.toLowerCase().includes(normalizedConnectorQuery) ||
			connector.type.toLowerCase().includes(normalizedConnectorQuery)
		);
	});

	const selectedModelLabel =
		CHAT_MODELS.find((model) => model.id === selectedModel)?.label ??
		selectedModel.replace(/^MODEL_/, '').replaceAll('_', ' ');

	const selectedChips = selectedConnectorIds.map((id) => {
		const match = connectors.connectors.find((connector) => connector.id === id);
		return {
			id,
			name: match?.name ?? `Connector ${id}`,
			type: match?.type ?? 'UNKNOWN'
		};
	});

	const closeMenu = useCallback(() => {
		setMenuOpen(false);
		setFlyout(null);
		setConnectorQuery('');
	}, []);

	function openMenu(initialFlyout: Flyout | null = null) {
		if (configLocked) return;
		setMenuOpen(true);
		setFlyout(initialFlyout);
		setConnectorQuery('');
		if (initialFlyout === 'connectors') void connectorsCache.load();
	}

	function toggleMenu() {
		if (configLocked) return;
		if (menuOpen) {
			closeMenu();
			return;
		}
		openMenu();
	}

	function openFlyout(next: Flyout) {
		if (configLocked) return;
		if (flyout === next) return;
		setFlyout(next);
		setConnectorQuery('');
		if (next === 'connectors') void connectorsCache.load();
	}

	function selectModel(modelId: string) {
		if (configLocked) return;
		onModelChange?.(modelId);
		closeMenu();
		textareaRef.current?.focus();
	}

	function toggleConnector(connector: { id: number }) {
		if (configLocked) return;
		if (selectedConnectorIds.includes(connector.id)) {
			onConnectorIdsChange?.(selectedConnectorIds.filter((id) => id !== connector.id));
		} else {
			onConnectorIdsChange?.([...selectedConnectorIds, connector.id]);
		}
	}

	function removeConnector(id: number) {
		if (configLocked) return;
		onConnectorIdsChange?.(selectedConnectorIds.filter((selectedId) => selectedId !== id));
	}

	const resizeTextarea = useCallback(() => {
		const el = textareaRef.current;
		if (!el) return;
		el.style.height = '0px';
		const next = Math.min(el.scrollHeight, TEXTAREA_MAX_PX);
		el.style.height = `${next}px`;
		el.style.overflowY = el.scrollHeight > TEXTAREA_MAX_PX ? 'auto' : 'hidden';
	}, []);

	useLayoutEffect(() => {
		resizeTextarea();
	}, [value, resizeTextarea]);

	function insertNewline() {
		const el = textareaRef.current;
		if (!el) return;
		const start = el.selectionStart;
		const end = el.selectionEnd;
		onValueChange?.(`${value.slice(0, start)}\n${value.slice(end)}`);
		queueMicrotask(() => {
			el.selectionStart = el.selectionEnd = start + 1;
			resizeTextarea();
			el.focus();
		});
	}

	function handleComposerKeydown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
		if (event.key !== 'Enter') return;

		// Cmd/Ctrl+Enter or Shift+Enter → new line (grows until max, then scrolls).
		if (event.metaKey || event.ctrlKey || event.shiftKey) {
			event.preventDefault();
			insertNewline();
			return;
		}

		event.preventDefault();
		onSend?.();
	}

	useDismissable(menuOpen, closeMenu, {
		contains: (target) => target instanceof Node && menuRootRef.current?.contains(target) === true,
		// Escape backs out of an open flyout first, and only then closes the menu.
		onEscape: (event) => {
			event.preventDefault();
			if (!flyout) return false;
			setFlyout(null);
			setConnectorQuery('');
			return true;
		}
	});

	useEffect(() => {
		if (flyout === 'connectors') queueMicrotask(() => searchRef.current?.focus());
	}, [flyout]);

	return (
		// `composer-shell` stays unhashed so ChatPage's dock can centre it via :global().
		<div className={cx(
				'composer-shell flex flex-col gap-2',
				docked ? 'w-[min(720px,100%)]' : 'w-[min(640px,100%)]',
				className
			)}>
			<div className="flex w-full flex-col gap-2 rounded-lg border border-[color-mix(in_srgb,var(--color-line)_95%,#cfcfd4)] bg-elevate px-3.5 pt-3 pb-2.5 shadow-[0_1px_2px_rgba(15,15,20,0.03),0_10px_28px_rgba(15,15,20,0.06)] focus-within:border-[color-mix(in_srgb,var(--color-accent)_35%,var(--color-line))] focus-within:shadow-[0_1px_2px_rgba(15,15,20,0.03),0_12px_32px_rgba(15,15,20,0.07),0_0_0_3px_color-mix(in_srgb,var(--color-accent)_12%,transparent)]">
				<textarea
					ref={textareaRef}
					className="max-h-40 min-h-[22px] w-full resize-none overflow-y-hidden border-0 bg-transparent px-1 py-0 text-[14px] leading-[1.55] text-ink outline-0 placeholder:text-[#a1a1aa]"
					value={value}
					onChange={(event) => onValueChange?.(event.target.value)}
					onKeyDown={handleComposerKeydown}
					rows={1}
					placeholder="Plan, @ for context, / for commands"
					aria-label="Message"
				/>

				<div className="flex items-center justify-between gap-2.5">
					<div className="relative flex min-w-0 flex-1 items-center gap-1.5" ref={menuRootRef}>
						{!configLocked && (
							<button
								type="button"
								className={cx(
									'inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full border border-transparent',
									menuOpen || selectedConnectorIds.length > 0
										? 'bg-ink/4 text-[#71717a]'
										: 'bg-transparent text-[#a1a1aa] hover:bg-ink/4 hover:text-[#71717a]'
								)}
								aria-label="Composer settings"
								aria-haspopup="menu"
								aria-expanded={menuOpen}
								onClick={toggleMenu}
							>
								<Plus size={15} strokeWidth={1.5} aria-hidden="true" />
							</button>
						)}

						{menuOpen && !configLocked && (
							<div className="absolute bottom-[calc(100%+8px)] left-0 z-20">
								<div
									className={cx(POPOVER, 'relative w-[min(240px,calc(100vw-32px))]')}
									role="menu"
									aria-label="Composer settings"
								>
									<div className={MENU_SECTION}>
										{ROOT_ITEMS.map((item) => (
											<button
												key={item.id}
												type="button"
												className={cx(MENU_ROW, flyout === item.id ? 'bg-fill' : 'bg-transparent hover:bg-fill')}
												role="menuitem"
												aria-haspopup="menu"
												aria-expanded={flyout === item.id}
												onMouseEnter={() => openFlyout(item.id)}
												onFocus={() => openFlyout(item.id)}
												onClick={() => openFlyout(item.id)}
											>
												<span className={cx(MENU_ROW_MAIN, 'items-center gap-2')}>
													<span className="inline-flex size-3.5 shrink-0 items-center justify-center text-[#71717a]" aria-hidden="true">
														<item.Icon size={14} strokeWidth={1.5} />
													</span>
													{item.label}
												</span>
												<span className="inline-flex min-w-0 items-center gap-1.5">
													{item.id === 'connectors' && selectedConnectorIds.length > 0 ? (
														<span className="inline-flex min-w-[18px] items-center justify-center rounded-full bg-sidebar px-1.5 py-px text-[11px] font-semibold text-text-2">{selectedConnectorIds.length}</span>
													) : item.id === 'models' ? (
														<span className="max-w-[90px] overflow-hidden text-[10.5px] text-ellipsis whitespace-nowrap text-muted">{selectedModelLabel}</span>
													) : null}
													<ChevronRight
														className="shrink-0 text-[#a1a1aa]"
														size={14}
														strokeWidth={1.5}
														aria-hidden="true"
													/>
												</span>
											</button>
										))}
									</div>
								</div>

								{flyout === 'models' && (
									<div
										className={cx(
										POPOVER,
										'absolute bottom-0 left-[calc(100%+4px)] w-[min(272px,calc(100vw-32px))] animate-flyout-in motion-reduce:animate-none',
										'max-[560px]:bottom-[calc(100%+4px)] max-[560px]:left-0 max-[560px]:w-[min(240px,calc(100vw-32px))]'
									)}
										role="menu"
										aria-label="Models"
									>
										<div className={cx(MENU_SECTION, 'max-h-60 overflow-y-auto pb-1')}>
											{CHAT_MODELS.map((model) => (
												<button
													key={model.id}
													type="button"
													className={cx(
														MENU_ROW,
												selectedModel === model.id ? 'bg-fill' : 'bg-transparent hover:bg-fill'
													)}
													role="menuitem"
													onClick={() => selectModel(model.id)}
												>
													<span className="inline-flex min-w-0 items-center gap-2">
														<img
															className="size-4 shrink-0 rounded-[3px] object-contain"
															src={connectorIconSrc(model.provider)}
															alt=""
														/>
														<span className={cx(MENU_ROW_MAIN, 'flex-col items-start gap-px')}>
															<span className="overflow-hidden text-[12.5px] font-semibold text-ellipsis whitespace-nowrap text-text-strong">{model.label}</span>
															<span className="overflow-hidden text-[11px] text-ellipsis whitespace-nowrap text-muted">{model.hint}</span>
														</span>
													</span>
													{selectedModel === model.id && (
														<span className={CHECK_MARK} aria-hidden="true">
															<Check size={14} strokeWidth={1.5} />
														</span>
													)}
												</button>
											))}
										</div>
									</div>
								)}

								{flyout === 'connectors' && (
									<div
										className={cx(
										POPOVER,
										'absolute bottom-0 left-[calc(100%+4px)] w-[min(272px,calc(100vw-32px))] animate-flyout-in motion-reduce:animate-none',
										'max-[560px]:bottom-[calc(100%+4px)] max-[560px]:left-0 max-[560px]:w-[min(240px,calc(100vw-32px))]'
									)}
										role="menu"
										aria-label="Connectors"
									>
										<label className="block px-1.5 pt-1.5 pb-1">
											<span className="sr-only">Search connectors</span>
											<input
												ref={searchRef}
												className="w-full rounded-[7px] border-0 bg-fill px-2 py-1.5 text-[12px] text-ink outline-0 placeholder:text-[#a1a1aa] focus:bg-sidebar"
												type="search"
												value={connectorQuery}
												onChange={(event) => setConnectorQuery(event.target.value)}
												placeholder="Search connectors..."
												autoComplete="off"
											/>
										</label>

										<div
											className="flex max-h-[220px] flex-col gap-px overflow-y-auto px-0.5 pt-0.5 pb-1.5"
											aria-live="polite"
											aria-busy={connectors.loading}
										>
											{connectors.loading && !connectors.loaded ? (
												<p className={cx(STATE_COPY, 'p-2')}>Loading connectors…</p>
											) : connectors.error && !connectors.loaded ? (
												<div className="flex flex-col items-start gap-1.5 px-2 py-1.5">
													<p className={STATE_COPY}>
														Couldn’t load connectors.
													</p>
													<button
														type="button"
														className="rounded-[8px] bg-[color-mix(in_srgb,var(--color-accent)_8%,var(--color-elevate))] px-2.5 py-[5px] text-[12px] font-medium text-accent hover:bg-[color-mix(in_srgb,var(--color-accent)_14%,var(--color-elevate))]"
														onClick={() => connectorsCache.load(true)}
													>
														Retry
													</button>
												</div>
											) : connectors.connectors.length === 0 ? (
												<p className={cx(STATE_COPY, 'p-2')}>No connectors available.</p>
											) : filteredConnectors.length === 0 ? (
												<p className={cx(STATE_COPY, 'p-2')}>No matches.</p>
											) : (
												filteredConnectors.map((connector) => (
													<button
														key={connector.id}
														type="button"
														className={cx(
															'flex w-full items-center gap-2 rounded-[7px] px-2 py-[7px] text-left text-inherit',
														selectedConnectorIds.includes(connector.id)
															? 'bg-fill'
															: 'bg-transparent hover:bg-fill'
														)}
														onClick={() => toggleConnector(connector)}
													>
														<img
															className="size-4 shrink-0 object-contain"
															src={connectorIconSrc(connector.type)}
															alt=""
														/>
														<span className="min-w-0 flex-1 overflow-hidden text-[12.5px] font-medium text-ellipsis whitespace-nowrap text-text-strong">{connector.name}</span>
														{selectedConnectorIds.includes(connector.id) && (
															<span className={CHECK_MARK} aria-hidden="true">
																<Check size={14} strokeWidth={1.5} />
															</span>
														)}
													</button>
												))
											)}
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					<div className="flex shrink-0 items-center gap-2">
						<span className="pointer-events-none inline-block max-w-40 overflow-hidden text-[12px] leading-[1.2] font-medium text-ellipsis whitespace-nowrap text-[#a1a1aa] select-none max-[560px]:max-w-[110px]" aria-label={`Model: ${selectedModelLabel}`}>
							{selectedModelLabel}
						</span>
						<button
							type="button"
							className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-[#171717] text-white transition-[opacity,transform] duration-[120ms] hover:not-disabled:-translate-y-px disabled:cursor-not-allowed disabled:opacity-35 motion-reduce:transition-none"
							disabled={!value.trim() || sending}
							aria-label="Send message"
							onClick={() => onSend?.()}
						>
							<ArrowUp size={15} strokeWidth={2} aria-hidden="true" />
						</button>
					</div>
				</div>
			</div>

			{selectedChips.length > 0 && (
				<div className="flex flex-wrap items-center gap-1.5 px-1" aria-label="Attached connectors">
					{selectedChips.map((chip) => (
						<span key={chip.id} className={cx(
								'inline-flex max-w-full items-center gap-1.5 rounded-[7px] border border-line bg-sidebar py-[3px] pl-[7px] text-[12px] leading-[1.2] font-medium text-text-strong [&_img]:size-3.5 [&_img]:shrink-0 [&_img]:object-contain',
								configLocked ? 'pr-[9px]' : 'pr-[5px]'
							)}>
							<img src={connectorIconSrc(chip.type)} alt="" />
							<span className="max-w-[180px] overflow-hidden text-ellipsis whitespace-nowrap">{chip.name}</span>
							{!configLocked && (
								<button
									type="button"
									className="inline-flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-full bg-transparent p-0 text-[#a1a1aa] hover:bg-ink/8 hover:text-[#52525b] focus-visible:bg-ink/8 focus-visible:text-[#52525b]"
									aria-label={`Remove ${chip.name}`}
									onClick={() => removeConnector(chip.id)}
								>
									<X size={12} strokeWidth={2} aria-hidden="true" />
								</button>
							)}
						</span>
					))}
				</div>
			)}
		</div>
	);
}
