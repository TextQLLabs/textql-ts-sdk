import type { FileContents } from '@pierre/diffs';
import { useEffect, useRef, useState } from 'react';

import { cx } from '../lib/cx';

type Props = {
	fileName: string;
	contents: string;
	lang?: string;
	/** Fill the parent's height and scroll, instead of the 320px inline cap. */
	fill?: boolean;
};

export function PierreCode({ fileName, contents, lang, fill = false }: Props) {
	const wrapperRef = useRef<HTMLDivElement | null>(null);
	// Pierre's `File` conflicts with the Web File type, so it stays untyped here.
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const viewerRef = useRef<any>(null);
	const hostRef = useRef<HTMLElement | null>(null);
	const lastKeyRef = useRef('');
	const [loadError, setLoadError] = useState(false);

	const currentKey = `${fileName}\0${lang ?? ''}\0${contents ?? ''}`;

	// Boot the custom-element viewer once; the effect below re-renders on change.
	useEffect(() => {
		let destroyed = false;

		(async () => {
			try {
				const { File: PierreFile, DEFAULT_THEMES, DIFFS_TAG_NAME } = await import('@pierre/diffs');
				if (destroyed || !wrapperRef.current) return;

				const el = document.createElement(DIFFS_TAG_NAME);
				el.className = 'block w-full';
				wrapperRef.current.appendChild(el);
				hostRef.current = el;

				viewerRef.current = new PierreFile({
					theme: DEFAULT_THEMES,
					themeType: 'light',
					disableFileHeader: true,
					disableLineNumbers: true,
					overflow: 'wrap',
					// The viewer renders into a shadow root, so its internals can only
					// be reached with real CSS — Tailwind classes don't cross that line.
					unsafeCSS: `
:host {
  --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
pre {
  margin: 0 !important;
  padding: 0.5rem 0.625rem !important;
  background: transparent !important;
  font-size: 11.5px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}
code, pre, [class*="line"] {
  font-family: var(--font-mono) !important;
}
					`.trim()
				});

				if (destroyed) return;
				// Force the first paint; the keyed effect below owns later updates.
				lastKeyRef.current = '';
				renderFile();
			} catch {
				setLoadError(true);
			}
		})();

		return () => {
			destroyed = true;
			if (viewerRef.current) {
				viewerRef.current.cleanUp();
				viewerRef.current = null;
			}
			hostRef.current = null;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- mount/unmount only
	}, []);

	function renderFile() {
		const viewer = viewerRef.current;
		const host = hostRef.current;
		if (!viewer || !host) return;
		const file: FileContents = {
			name: fileName,
			contents: contents ?? '',
			lang: lang as FileContents['lang'] | undefined,
			cacheKey: currentKey
		};
		viewer.render({ file, fileContainer: host, forceRender: true });
		lastKeyRef.current = currentKey;
	}

	useEffect(() => {
		const host = hostRef.current;
		if (!viewerRef.current || !host) return;
		host.setAttribute('aria-label', `Contents of ${fileName}`);
		if (currentKey !== lastKeyRef.current) renderFile();
	});

	return (
		<div
			className={cx(
				'overflow-auto rounded-xs bg-ink/5',
				// Fill the parent (e.g. the ontology viewer) and scroll instead of capping.
				fill ? 'max-h-none min-h-0 flex-1' : 'max-h-80'
			)}
			ref={wrapperRef}
		>
			{loadError && (
				<pre className="m-0 px-2.5 py-2 font-mono text-[11.5px] leading-normal whitespace-pre-wrap wrap-anywhere">
					{contents}
				</pre>
			)}
		</div>
	);
}
