import { ArrowRight, FileSpreadsheet, Upload, X } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';

import { cx } from '@ui/lib/cx';
import { toast } from '@ui/primitives';

import { MAX_UPLOAD_BYTES, TABULAR_EXTENSIONS, isTabularFile } from '../lib/files';


function formatBytes(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const SUGGESTIONS = [
	'Focus on trends over time',
	'Find outliers and explain them',
	'Break results down by category'
];

type Props = { onStart: (file: File, instruction: string) => void };

export function NewRun({ onStart }: Props) {
	const [file, setFile] = useState<File | null>(null);
	const [instruction, setInstruction] = useState('');
	const [dragging, setDragging] = useState(false);
	const inputRef = useRef<HTMLInputElement | null>(null);

	function pick(files: FileList | null) {
		const next = files?.[0];
		if (!next) return;
		if (files.length > 1) toast.message('One file at a time — using the first one.');
		if (!isTabularFile(next.name)) {
			toast.error(`Choose a ${TABULAR_EXTENSIONS.join(', ')} file.`);
			return;
		}
		if (next.size === 0) {
			toast.error('That file is empty.');
			return;
		}
		if (next.size > MAX_UPLOAD_BYTES) {
			toast.error('Files must be 100 MB or smaller.');
			return;
		}
		setFile(next);
	}

	function onDrop(event: DragEvent) {
		event.preventDefault();
		setDragging(false);
		pick(event.dataTransfer.files);
	}

	function submit() {
		if (file) onStart(file, instruction);
	}

	return (
		<div className="flex h-full min-h-0 items-center justify-center overflow-y-auto px-6 py-10">
			<div className="flex w-[min(560px,100%)] flex-col gap-5">
				<div className="flex flex-col gap-1.5">
					<h1 className="m-0 font-pixel text-[30px] leading-none tracking-[-0.01em] text-ink">
						Analyze a data file
					</h1>
					<p className="m-0 text-[13.5px] leading-[1.5] text-muted">
						Drop in one CSV or spreadsheet. The agent parses and cleans it, writes the tables it derives as new
						CSVs, and draws three charts.
					</p>
				</div>

				<div
					role="button"
					tabIndex={0}
					onClick={() => inputRef.current?.click()}
					onKeyDown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
					}}
					onDragOver={(e) => {
						e.preventDefault();
						setDragging(true);
					}}
					onDragLeave={() => setDragging(false)}
					onDrop={onDrop}
					className={cx(
						'group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-10 text-center transition-[background,border-color] duration-150 outline-0 focus-visible:border-accent',
						dragging
							? 'border-accent bg-[color-mix(in_srgb,var(--color-accent)_7%,var(--color-elevate))]'
							: 'border-[color-mix(in_srgb,var(--color-line)_100%,#c4c4c8)] bg-elevate/70 hover:bg-elevate'
					)}
				>
					<input
						ref={inputRef}
						type="file"
						accept={TABULAR_EXTENSIONS.join(',')}
						className="hidden"
						onChange={(e) => {
							pick(e.target.files);
							e.target.value = '';
						}}
					/>
					{file ? (
						<div className="flex w-full items-center gap-3 rounded-md bg-fill px-3.5 py-3 text-left">
							<span className="inline-flex size-9 shrink-0 items-center justify-center rounded-sm bg-[color-mix(in_srgb,var(--color-accent)_14%,transparent)] text-accent">
								<FileSpreadsheet size={18} strokeWidth={1.75} />
							</span>
							<span className="flex min-w-0 flex-1 flex-col">
								<span className="truncate text-[13.5px] font-medium text-ink">{file.name}</span>
								<span className="font-mono text-[11px] text-muted">{formatBytes(file.size)}</span>
							</span>
							<button
								type="button"
								aria-label="Remove file"
								className="inline-flex size-7 cursor-pointer items-center justify-center rounded-xs border-0 bg-transparent text-muted hover:bg-elevate hover:text-ink"
								onClick={(e) => {
									e.stopPropagation();
									setFile(null);
								}}
							>
								<X size={14} />
							</button>
						</div>
					) : (
						<>
							<span className="inline-flex size-11 items-center justify-center rounded-md bg-fill text-text-3 transition-transform duration-150 group-hover:-translate-y-0.5">
								<Upload size={19} strokeWidth={1.75} />
							</span>
							<span className="flex flex-col gap-0.5">
								<span className="text-[14px] font-medium text-ink">
									{dragging ? 'Release to add it' : 'Drop a file here, or click to browse'}
								</span>
								<span className="font-mono text-[11px] text-muted">{TABULAR_EXTENSIONS.join(' · ')} — up to 100 MB</span>
							</span>
						</>
					)}
				</div>

				<div className="flex flex-col gap-2">
					<label className="flex flex-col overflow-hidden rounded-md border border-line bg-elevate focus-within:border-accent">
						<span className="px-3.5 pt-2.5 text-[11px] font-semibold tracking-[0.05em] text-muted uppercase">
							Instructions <span className="font-normal tracking-normal normal-case">(optional)</span>
						</span>
						<textarea
							value={instruction}
							onChange={(e) => setInstruction(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
							}}
							rows={2}
							placeholder="e.g. Treat region as the main dimension and compare quarters"
							className="resize-none border-0 bg-transparent px-3.5 pt-1 pb-3 text-[13.5px] leading-[1.5] text-ink outline-0 placeholder:text-muted"
						/>
					</label>
					<div className="flex flex-wrap gap-1.5">
						{SUGGESTIONS.map((s) => (
							<button
								key={s}
								type="button"
								className="cursor-pointer rounded-sm border-0 bg-transparent px-2 py-1 text-[12px] text-text-3 shadow-[inset_0_0_0_1px_var(--color-line)] hover:bg-elevate hover:text-ink"
								onClick={() => setInstruction(s)}
							>
								{s}
							</button>
						))}
					</div>
				</div>

				<button
					type="button"
					disabled={!file}
					onClick={submit}
					className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border-0 bg-ink text-[13.5px] font-medium text-paper transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
				>
					Run analysis
					<ArrowRight size={15} />
				</button>
			</div>
		</div>
	);
}
