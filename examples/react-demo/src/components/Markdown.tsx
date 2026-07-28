import { marked } from 'marked';
import { useEffect, useRef, useState } from 'react';
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
};

export function Markdown({ renderedHtml = '', content = '' }: Props) {
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

	const html = renderedHtml.trim() ? sanitize(renderedHtml) : parsedContent;

	if (html) {
		// Allowlist-sanitized above.
		// The bare `md` class is a stable hook other components style via :global().
		return <div className={`md ${styles.md}`} dangerouslySetInnerHTML={{ __html: html }} />;
	}
	if (content) {
		return <p className={`md-plain ${styles.mdPlain}`}>{content}</p>;
	}
	return null;
}
