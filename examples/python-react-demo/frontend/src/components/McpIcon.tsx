import { connectorIconSrc } from '../lib/connectorIcons';
import { cx } from '../lib/cx';

const MCP_SRC = connectorIconSrc('MCP');

/**
 * The Model Context Protocol mark, for `mcpToolCell`. Lucide has no MCP icon —
 * not in 0.545, not in 1.34 — so this reuses the official mark already vendored
 * for MCP *connectors* rather than falling back to a generic wrench.
 *
 * Drawn as a mask, not an `<img>`: the asset is `fill="currentColor"`, which an
 * image cannot inherit, so it paints black and vanishes against a dark
 * background. Masking pushes `currentColor` through the shape instead, so it
 * follows the theme exactly like the lucide icons beside it.
 *
 * Takes a `LucideIcon`'s props so `getCellTypeInfo` callers need no special case.
 */
export function McpIcon({ size = 16, className }: { size?: number; className?: string }) {
	return (
		<span
			aria-hidden
			className={cx('inline-block shrink-0 bg-current', className)}
			style={{
				width: size,
				height: size,
				maskImage: `url(${MCP_SRC})`,
				WebkitMaskImage: `url(${MCP_SRC})`,
				maskSize: 'contain',
				WebkitMaskSize: 'contain',
				maskRepeat: 'no-repeat',
				WebkitMaskRepeat: 'no-repeat',
				maskPosition: 'center',
				WebkitMaskPosition: 'center'
			}}
		/>
	);
}
