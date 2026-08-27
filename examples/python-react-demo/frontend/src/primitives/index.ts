// Reusable base components ("primitives").
// Import from here: `import { Tooltip, toast } from '../primitives'`
export { Confirm } from './Confirm';
// Imperative, promise-based confirmation: `if (await confirm({...})) { ... }`
export { confirm } from './confirmDialog';
export { Page } from './Page';
export { Toaster, toast } from './Toaster';
export { Tooltip } from './Tooltip';
export {
	ViewSwitcher,
	ViewSwitcherItem,
	ViewSwitcherList,
	ViewSwitcherPanel,
	type View
} from './ViewSwitcher';
export type { ConfirmOptions, ConfirmTone } from './modalTypes';
