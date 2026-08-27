import { marked } from 'marked';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import sanitizeHtml from 'sanitize-html';

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

type Props = {
	renderedHtml?: string;
	content?: string;
	muted?: boolean;
};

/**
 * Memoized on primitive props: ToolSequence renders one of these per prose cell
 * in the transcript, and every SSE event would otherwise re-sanitize all of them.
 */
export const Markdown = memo(function Markdown({
	renderedHtml = '',
	content = '',
	muted = false
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

	const tone = muted ? ` ${styles.mdMuted}` : '';

	if (html) {
		// Allowlist-sanitized above.
		// The bare `md` class is a stable hook other components style via :global().
		return (
			<div
				className={`md ${styles.md}${tone}`}
				dangerouslySetInnerHTML={{ __html: html }}
			/>
		);
	}
	if (content) {
		return <p className={`md-plain ${styles.mdPlain}${muted ? ` ${styles.mdPlainMuted}` : ''}`}>{content}</p>;
	}
	return null;
});
