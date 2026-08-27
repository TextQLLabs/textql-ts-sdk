import { BlockCell } from './BlockCell';
import { makeListCell } from './ListCell';
import { SqlCell } from './SqlCell';
import type { CellComponent } from './types';

function str(value: unknown): string {
	return typeof value === 'string' ? value : '';
}

/**
 * Cell case → the component that renders its body. A type absent from here
 * falls back to BlockCell, so every cell renders; adding an entry is how a type
 * graduates from generic blocks to its own UI and state.
 */
const CELL_COMPONENTS: Record<string, CellComponent> = {
	sqlCell: SqlCell,
	tableauSqlCell: SqlCell,
	listDashboardsCell: makeListCell({
		key: 'dashboards',
		noun: 'dashboards',
		row: (item) => ({ title: str(item.name) || 'dashboard', subtitle: str(item.status) || undefined })
	}),
	listAppsCell: makeListCell({
		key: 'apps',
		noun: 'apps',
		row: (item) => ({ title: str(item.name) || 'app', subtitle: str(item.status) || undefined })
	}),
	listUsersCell: makeListCell({
		key: 'agents',
		noun: 'users',
		row: (item) => ({
			title: str(item.name) || 'user',
			subtitle: str(item.email) || str(item.type) || undefined
		})
	})
};

export function getCellComponent(cellCase: string | undefined): CellComponent {
	return (cellCase && CELL_COMPONENTS[cellCase]) || BlockCell;
}
