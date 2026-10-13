import { Info } from 'lucide-react';

import { Button } from './Button';
import { Modal } from './Modal';

type Props = {
	title?: string;
	description?: string;
	confirmLabel?: string;
	cancelLabel?: string;
	/** Fired when the primary action is pressed. The dialog does not close itself. */
	onConfirm?: () => void;
	/** Fired on cancel, backdrop, or Escape. */
	onCancel?: () => void;
};

export function Confirm({
	title = 'Are you sure?',
	description,
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
	onConfirm,
	onCancel
}: Props) {
	return (
		<Modal
			open
			title={title}
			onClose={onCancel}
			actions={
				<>
					<Button variant="ghost" onClick={onCancel}>
						{cancelLabel}
					</Button>
					<Button variant="solid" onClick={onConfirm}>
						{confirmLabel}
					</Button>
				</>
			}
		>
			<div className="flex items-start gap-3">
				<span
					className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-line/60 text-muted"
					aria-hidden="true"
				>
					<Info className="size-4" strokeWidth={2} />
				</span>
				<div className="min-w-0 flex-1">{description ? <p>{description}</p> : null}</div>
			</div>
		</Modal>
	);
}
