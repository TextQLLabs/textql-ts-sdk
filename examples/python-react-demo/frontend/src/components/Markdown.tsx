import { Link } from 'lucide-react';
import { marked } from 'marked';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import sanitizeHtml from 'sanitize-html';

import { decorateCitations } from '../lib/citationMarkers';
import type { CitationView } from '../lib/citations';
import { CitationCard, CITATION_CARD_WIDTH, type CitationCardPlacement } from './CitationCard';
import styles from './Markdown.module.css';

marked.setOptions({ gfm: true, breaks: true });

const STREAM_PARSE_INTERVAL_MS = 120;

const sanitizeOptions: sanitizeHtml.IOptions = {
	allowedTags: [
		'a',
		'blockquote',
		'br',
		'code',
		'del',
		'div',
		'em',
		'h1',
		'h2',
		'h3',
		'h4',
		'h5',
		'h6',
		'hr',
		'img',
		'li',
		'ol',
		'p',
		'pre',
		'span',
		'strong',
		'table',
		'tbody',
		'td',
		'thead',
		'th',
		'tr',
		'ul'
	],
	allowedAttributes: {
		a: ['href', 'title'],
		code: ['class'],
		div: ['class'],
		img: ['src', 'alt', 'title', 'width', 'height'],
		pre: ['class'],
		span: ['class'],
		td: ['align'],
		th: ['align']
	},
	allowedSchemes: ['http', 'https', 'mailto'],
	allowedSchemesByTag: { img: ['http', 'https'] },
	allowProtocolRelative: false,
	transformTags: {
		a: sanitizeHtml.simpleTransform('a', { rel: 'noreferrer noopener' })
	}
};

function sanitize(value: string): string {
	return sanitizeHtml(value, sanitizeOptions);
}

function parse(text: string): string {
	if (!text.trim()) return '';
	try {
		return sanitize(marked.parse(text, { async: false }) as string);
	} catch {
		return '';
	}
}

const HOVER_HIDE_MS = 150;
const VIEWPORT_MARGIN_PX = 12;
/** Below this the marker is too near the top for a card above it. */
const FLIP_BELOW_PX = 220;

const NO_CITATIONS: CitationView[] = [];

type Props = {
	renderedHtml?: string;
	content?: string;
	muted?: boolean;
	/** Draws a numbered marker at each citation's anchor. */
	citations?: CitationView[];
	onCitationClick?: (key: string) => void;
};

/**
 * Memoized on primitive props: ToolSequence renders one of these per prose cell
 * in the transcript, and every SSE event would otherwise re-sanitize all of them.
 */
export const Markdown = memo(function Markdown({
	renderedHtml = '',
	content = '',
	muted = false,
	citations = NO_CITATIONS,
	onCitationClick
}: Props) {
	const [parsedContent, setParsedContent] = useState(() => parse(content));
	const lastParsedText = useRef(content);
	const lastParsedAt = useRef(Date.now());

	// Throttle re-parsing while a cell streams in, one parse per 120ms at most.
	useEffect(() => {
		if (content === lastParsedText.current) return;
		const now = Date.now();
		const wait = Math.max(0, lastParsedAt.current + STREAM_PARSE_INTERVAL_MS - now);
		const handle = setTimeout(() => {
			lastParsedAt.current = Date.now();
			lastParsedText.current = content;
			setParsedContent(parse(content));
		}, wait);
		return () => clearTimeout(handle);
	}, [content]);

	const serverHtml = useMemo(
		() => (renderedHtml.trim() ? sanitize(renderedHtml) : ''),
		[renderedHtml]
	);
	const html = serverHtml || parsedContent;

	const contentRef = useRef<HTMLDivElement | null>(null);
	const iconHostRef = useRef<HTMLSpanElement | null>(null);
	const hideTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const [card, setCard] = useState<CitationCardPlacement | null>(null);

	// Read at click time: a marker outlives the render that built it, and the
	// decoration is skipped while the citations are unchanged, so the listener
	// must not close over the handler it was given.
	const clickHandler = useRef(onCitationClick);
	useEffect(() => {
		clickHandler.current = onCitationClick;
	}, [onCitationClick]);

	const cancelHide = useCallback(() => clearTimeout(hideTimer.current), []);

	// Delayed so the pointer can travel from the marker onto the card itself.
	const scheduleHide = useCallback(() => {
		clearTimeout(hideTimer.current);
		hideTimer.current = setTimeout(() => setCard(null), HOVER_HIDE_MS);
	}, []);

	useEffect(() => () => clearTimeout(hideTimer.current), []);

	const showCard = useCallback(
		(marker: HTMLElement, citation: CitationView) => {
			clearTimeout(hideTimer.current);
			const rect = marker.getBoundingClientRect();
			const below = rect.top < FLIP_BELOW_PX;
			setCard({
				citation,
				top: below ? rect.bottom + 8 : rect.top - 8,
				left: Math.max(
					VIEWPORT_MARGIN_PX,
					Math.min(rect.left, window.innerWidth - CITATION_CARD_WIDTH - VIEWPORT_MARGIN_PX)
				),
				below
			});
		},
		[]
	);

	/**
	 * Built as DOM rather than JSX because the marker has to land *inside* the
	 * rendered HTML, between two words of a paragraph React does not own. The
	 * link glyph is cloned out of the hidden lucide instance below.
	 */
	const buildMarker = useCallback(
		(citation: CitationView) => {
			const marker = document.createElement('button');
			marker.type = 'button';
			marker.className = 'citation-marker';
			marker.setAttribute('aria-label', `Source ${citation.marker}`);

			const number = document.createElement('span');
			number.className = 'citation-marker__num';
			number.textContent = String(citation.marker);
			marker.appendChild(number);

			const svg = iconHostRef.current?.querySelector('svg');
			if (svg) {
				const iconWrap = document.createElement('span');
				iconWrap.className = 'citation-marker__icon';
				iconWrap.appendChild(svg.cloneNode(true));
				marker.appendChild(iconWrap);
			}

			marker.addEventListener('pointerenter', () => showCard(marker, citation));
			marker.addEventListener('pointerleave', scheduleHide);
			marker.addEventListener('focus', () => showCard(marker, citation));
			marker.addEventListener('blur', scheduleHide);
			marker.addEventListener('click', () => {
				setCard(null);
				marker.blur();
				clickHandler.current?.(citation.key);
			});
			return marker;
		},
		[scheduleHide, showCard]
	);

	// Re-runs on every parse: React replacing the div's innerHTML drops the
	// markers, and `decorateCitations` is a no-op when they are still in place.
	useEffect(() => {
		const root = contentRef.current;
		if (!root) return;
		if (citations.length === 0 && root.dataset.citationSig === undefined) return;
		decorateCitations(root, citations, buildMarker);
	}, [html, citations, buildMarker]);

	const tone = muted ? ` ${styles.mdMuted}` : '';

	if (html) {
		// Allowlist-sanitized above.
		// The bare `md` class is a stable hook other components style via :global().
		return (
			<>
				<div
					className={`md ${styles.md}${tone}`}
					ref={contentRef}
					dangerouslySetInnerHTML={{ __html: html }}
				/>
				{citations.length > 0 && (
					<span className="hidden" aria-hidden="true" ref={iconHostRef}>
						<Link size={11} />
					</span>
				)}
				{card &&
					createPortal(
						<CitationCard
							{...card}
							onPointerEnter={cancelHide}
							onPointerLeave={scheduleHide}
						/>,
						document.body
					)}
			</>
		);
	}
	if (content) {
		return <p className={`md-plain ${styles.mdPlain}${muted ? ` ${styles.mdPlainMuted}` : ''}`}>{content}</p>;
	}
	return null;
});
