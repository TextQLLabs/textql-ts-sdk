import type { CitationSource } from '../lib/citationSource';
import { cx } from '../lib/cx';

type Size = 12 | 14 | 16;

const IMG: Record<Size, string> = { 12: 'size-3', 14: 'size-3.5', 16: 'size-4' };

/** A source's brand logo, or its kind's glyph when no connector resolved. */
export function SourceIcon({
	source,
	size,
	className
}: {
	source: CitationSource;
	size: Size;
	className?: string;
}) {
	if (source.logoUrl) {
		return (
			<img className={cx(IMG[size], 'shrink-0 object-contain', className)} src={source.logoUrl} alt="" />
		);
	}
	const Icon = source.icon;
	return Icon ? <Icon size={size} className={cx('shrink-0', className)} /> : null;
}
