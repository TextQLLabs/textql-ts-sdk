import { useCallback, useEffect, useState } from 'react';

/** Clipboard write plus the brief "copied" state a button swaps its icon on. */
export function useCopyToClipboard(resetMs = 1200): {
	copied: boolean;
	copy: (text: string) => Promise<void>;
} {
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!copied) return;
		const handle = setTimeout(() => setCopied(false), resetMs);
		return () => clearTimeout(handle);
	}, [copied, resetMs]);

	const copy = useCallback(async (text: string) => {
		await navigator.clipboard.writeText(text);
		setCopied(true);
	}, []);

	return { copied, copy };
}
