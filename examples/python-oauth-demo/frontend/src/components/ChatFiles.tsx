import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { listChatFiles, uploadChatFile, type ChatFile, type UploadedFile } from '../lib/api';

type Props = {
	chatId?: string;
	disabled: boolean;
	pendingFiles: UploadedFile[];
	onUploaded: (file: UploadedFile) => void;
	onRemove: (id: string) => void;
	preparing: boolean;
	onBusyChange: (busy: boolean) => void;
	onFilesChange: (chatId: string, files: ChatFile[]) => void;
};

export type ChatFilesHandle = { attach: (files: File[]) => Promise<void>; openPicker: () => void };

export const ChatFiles = forwardRef<ChatFilesHandle, Props>(function ChatFiles(
	{ chatId, disabled, pendingFiles, onUploaded, onRemove, preparing, onBusyChange, onFilesChange },
	ref
) {
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const [refresh, setRefresh] = useState(0);
	const input = useRef<HTMLInputElement>(null);
	const upload = useRef<AbortController | undefined>(undefined);
	const busy = useRef(false);
	const filesVersion = useRef(0);
	const filesChanged = useRef(onFilesChange);
	filesChanged.current = onFilesChange;

	useEffect(() => () => upload.current?.abort(), []);

	useEffect(() => {
		setError('');
		if (!chatId || busy.current) return;
		const version = filesVersion.current;
		const controller = new AbortController();
		async function load() {
			try {
				const snapshot = await listChatFiles(chatId!, controller.signal);
				if (controller.signal.aborted || version !== filesVersion.current) return;
				filesChanged.current(chatId!, snapshot);
			} catch (cause) {
				if (!controller.signal.aborted && version === filesVersion.current)
					setError(cause instanceof Error ? cause.message : 'Unable to load files.');
			}
		}
		void load();
		return () => controller.abort();
	}, [chatId, refresh]);

	async function attach(selected: File[]) {
		if (!selected.length || busy.current || disabled) return;
		if (selected.some((file) => file.size === 0 || file.size > 20 * 1024 * 1024)) {
			setError('Choose non-empty files up to 20 MiB each.');
			return;
		}
		busy.current = true;
		filesVersion.current += 1;
		setUploading(true);
		onBusyChange(true);
		setError('');
		const controller = new AbortController();
		upload.current = controller;
		try {
			for (const file of selected) {
				if (controller.signal.aborted) return;
				const uploaded = await uploadChatFile(file, controller.signal);
				if (!controller.signal.aborted) onUploaded(uploaded);
			}
		} catch (cause) {
			if (!controller.signal.aborted)
				setError(cause instanceof Error ? cause.message : 'Unable to upload files.');
		} finally {
			busy.current = false;
			setUploading(false);
			onBusyChange(false);
		}
	}

	useImperativeHandle(ref, () => ({ attach, openPicker: () => input.current?.click() }));

	return (
		<>
			{pendingFiles.length > 0 && (
				<ul aria-label="Uploaded files" className="flex flex-wrap gap-2">
					{pendingFiles.map((file) => (
						<li key={file.id} className="flex items-center gap-2 rounded-lg border border-line px-2 py-1 text-xs">
							<span className="max-w-48 truncate" title={file.name}>{file.name}</span>
							<span className="text-muted">{preparing ? 'Preparing…' : 'Uploaded'}</span>
							<button type="button" aria-label={`Remove ${file.name}`} disabled={disabled || uploading} onClick={() => onRemove(file.id)}>×</button>
						</li>
					))}
				</ul>
			)}
			{uploading && <p role="status" className="text-xs text-muted">Uploading files…</p>}
			{preparing && <p role="status" className="text-xs text-muted">Preparing files for your message…</p>}
			<input
				ref={input}
				type="file"
				multiple
				className="sr-only"
				aria-label="Upload files or CSVs"
				disabled={disabled || uploading}
				onChange={(event) => {
					void attach(Array.from(event.target.files ?? []));
					event.target.value = '';
				}}
			/>
			{error && (
				<div role="alert" className="flex items-center gap-2 text-red-600">
					{error}
					<button
						type="button"
						className="underline"
						onClick={() => setRefresh((value) => value + 1)}
					>
						Refresh files
					</button>
				</div>
			)}
		</>
	);
});
