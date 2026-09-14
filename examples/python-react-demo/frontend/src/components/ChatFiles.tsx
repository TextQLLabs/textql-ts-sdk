import { FileText, Paperclip } from 'lucide-react';
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { listChatFiles, uploadChatFile, type ChatFile } from '../lib/api';

type Props = {
	chatId?: string;
	disabled: boolean;
	ensureChat: () => Promise<string>;
	onBusyChange: (busy: boolean) => void;
};

export type ChatFilesHandle = { attach: (files: File[]) => Promise<void> };

export const ChatFiles = forwardRef<ChatFilesHandle, Props>(function ChatFiles(
	{ chatId, disabled, ensureChat, onBusyChange },
	ref
) {
	const [files, setFiles] = useState<ChatFile[]>([]);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState('');
	const [refresh, setRefresh] = useState(0);
	const input = useRef<HTMLInputElement>(null);
	const currentChat = useRef(chatId);
	currentChat.current = chatId;
	const upload = useRef<AbortController | undefined>(undefined);
	const uploadChat = useRef<string | undefined>(undefined);
	const busy = useRef(false);
	const filesVersion = useRef(0);

	useEffect(() => () => upload.current?.abort(), []);

	useEffect(() => {
		if (uploadChat.current && uploadChat.current !== chatId) upload.current?.abort();
	}, [chatId]);

	useEffect(() => {
		setFiles([]);
		setError('');
		if (!chatId || busy.current) return;
		const version = filesVersion.current;
		const controller = new AbortController();
		async function load() {
			try {
				const snapshot = await listChatFiles(chatId!, controller.signal);
				if (controller.signal.aborted || version !== filesVersion.current) return;
				setFiles(snapshot);
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
			const id = await ensureChat();
			uploadChat.current = id;
			for (const file of selected) {
				if (controller.signal.aborted) return;
				const snapshot = await uploadChatFile(id, file, controller.signal);
				if (currentChat.current === id) setFiles(snapshot);
			}
		} catch (cause) {
			if (!controller.signal.aborted)
				setError(cause instanceof Error ? cause.message : 'Unable to attach files.');
		} finally {
			uploadChat.current = undefined;
			busy.current = false;
			setUploading(false);
			onBusyChange(false);
		}
	}

	useImperativeHandle(ref, () => ({ attach }));

	return (
		<div className="flex flex-col gap-2 border-b border-line pb-2 text-[12px]">
			<div className="flex items-center justify-between gap-2">
				<button
					type="button"
					disabled={disabled || uploading}
					className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-text-2 hover:bg-fill disabled:opacity-50"
					onClick={() => input.current?.click()}
				>
					<Paperclip size={14} />
					{uploading ? 'Uploading and preparing files…' : 'Attach files or CSVs'}
				</button>
				<span className="text-right text-muted">Drop files here · 20 MiB per file</span>
			</div>
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
			{files.length > 0 && (
				<ul className="m-0 flex list-none flex-wrap gap-1.5 p-0" aria-label="Attached files">
					{files.map((file) => (
						<li
							key={file.id}
							className="flex max-w-full items-center gap-1.5 rounded-md border border-line px-2 py-1"
						>
							<FileText size={13} className="shrink-0" />
							<span className="truncate">{file.name}</span>
							<span className="text-muted">{file.status}</span>
							{file.error && <span role="alert">{file.error}</span>}
						</li>
					))}
				</ul>
			)}
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
		</div>
	);
});
