import { ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { api, errorMessage } from '../lib/api';
import { cx } from '../lib/cx';
import type { RegistrationRecord } from '../lib/registration';
import { Button, Page } from '../primitives';
import { inputClass } from './fields';
import { RegistrationSummary, RiskBadge, StatusLabel } from './RegistrationSummary';

function formatDate(value: string) {
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? value
		: date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export function RegistrationsPage() {
	const [records, setRecords] = useState<RegistrationRecord[] | null>(null);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [openId, setOpenId] = useState<string | null>(null);
	const [busyId, setBusyId] = useState<string | null>(null);
	const [actionError, setActionError] = useState<{ id: string; message: string } | null>(null);
	const [rejecting, setRejecting] = useState<{ id: string; note: string } | null>(null);

	const load = useCallback(async () => {
		setLoadError(null);
		try {
			const response = await api<{ registrations: RegistrationRecord[] }>('/api/registrations');
			setRecords(response.registrations);
		} catch (error) {
			setLoadError(errorMessage(error));
		}
	}, []);

	useEffect(() => {
		void load();
	}, [load]);

	async function act(id: string, action: 'approve' | 'reject', body: object = {}) {
		setBusyId(id);
		setActionError(null);
		try {
			const response = await api<{ registration: RegistrationRecord }>(
				`/api/registrations/${encodeURIComponent(id)}/${action}`,
				body
			);
			setRecords((current) =>
				current?.map((record) => (record.id === id ? response.registration : record)) ?? null
			);
			setRejecting(null);
		} catch (error) {
			setActionError({ id, message: errorMessage(error) });
		} finally {
			setBusyId(null);
		}
	}

	const groups = [
		{
			key: 'review',
			title: 'Waiting on review',
			hint: 'Approving creates the agent in TextQL with the registered connectors.',
			records: (records ?? []).filter(
				(record) => record.status === 'pending_review' || record.status === 'failed'
			)
		},
		{
			key: 'created',
			title: 'Created',
			hint: 'Registered agents that exist in TextQL.',
			records: (records ?? []).filter((record) => record.status === 'created')
		},
		{
			key: 'rejected',
			title: 'Rejected',
			hint: 'Returned to the requester with a reason.',
			records: (records ?? []).filter((record) => record.status === 'rejected')
		}
	].filter((group) => group.records.length > 0);

	return (
		<Page
			title="Registrations"
			lead="Every agent registration, its risk tier, and the review queue."
			actions={
				<Button variant="ghost" size="sm" onClick={() => void load()}>
					<RefreshCw size={12} />
					Refresh
				</Button>
			}
		>
			{loadError ? (
				<div className="flex flex-col items-center justify-center gap-2.5 px-4 py-12 text-center">
					<p className="m-0 text-[15px] font-medium text-ink">Registrations didn't load</p>
					<p className="m-0 text-[13px] leading-[1.45] text-muted">{loadError}</p>
				</div>
			) : records === null ? (
				<p className="m-0 flex items-center justify-center gap-2 py-12 text-[12.5px] text-muted">
					<Loader2 size={14} className="animate-spin" />
					Loading registrations
				</p>
			) : groups.length === 0 ? (
				<div className="flex flex-col items-center justify-center gap-2.5 px-4 py-12 text-center">
					<p className="m-0 text-[15px] font-medium text-ink">No registrations yet</p>
					<p className="m-0 text-[13px] leading-[1.45] text-muted">
						Registered agents and review tickets show up here.
					</p>
				</div>
			) : (
				<div className="flex w-full flex-col gap-7">
					{groups.map((group) => (
						<section key={group.key} className="flex min-w-0 flex-col gap-2.5">
							<div className="flex flex-col gap-0.5 px-0.5">
								<div className="flex items-baseline gap-2">
									<h2 className="m-0 font-sans text-[12px] font-semibold tracking-[0.06em] text-ink uppercase">
										{group.title}
									</h2>
									<span className="font-mono text-[11px] font-medium text-muted">
										{group.records.length}
									</span>
								</div>
								<p className="m-0 text-[11.5px] leading-[1.4] text-muted">{group.hint}</p>
							</div>

							<ul className="m-0 flex list-none flex-col gap-1.5 p-0">
								{group.records.map((record) => {
									const open = openId === record.id;
									const busy = busyId === record.id;
									const reviewable = record.status === 'pending_review' || record.status === 'failed';
									return (
										<li key={record.id} className="rounded-sm border border-line/80 bg-elevate">
											<button
												type="button"
												aria-expanded={open}
												onClick={() => setOpenId(open ? null : record.id)}
												className="flex w-full cursor-pointer items-center gap-3 rounded-sm border-0 bg-transparent px-3.5 py-2.5 text-left"
											>
												<ChevronRight
													size={14}
													className={cx(
														'shrink-0 text-muted transition-transform',
														open ? 'rotate-90' : 'rotate-0'
													)}
												/>
												<span className="flex min-w-0 flex-1 flex-col gap-0.5">
													<span className="truncate text-[13px] font-medium text-ink">
														{record.registration.agentName}
													</span>
													<span className="truncate text-[11.5px] text-muted">
														<span className="font-mono">{record.id}</span> ·{' '}
														{record.registration.applicationCode} · {record.application.name} ·{' '}
														{formatDate(record.createdAt)}
													</span>
												</span>
												<RiskBadge tier={record.risk.tier} />
												<span className="max-[560px]:hidden">
													<StatusLabel status={record.status} />
												</span>
											</button>

											{open && (
												<div className="flex flex-col gap-4 border-t border-line/80 px-3.5 py-4">
													{record.risk.reasons.length > 0 && (
														<p className="m-0 text-[12px] leading-[1.45] text-text-3">
															Flagged for: {record.risk.reasons.join('; ')}.
														</p>
													)}
													{record.agentId && (
														<p className="m-0 text-[12px] text-text-3">
															Agent ID <span className="font-mono text-ink">{record.agentId}</span>
														</p>
													)}
													{record.error && (
														<p className="m-0 text-[12px] text-red-500">Creation failed: {record.error}</p>
													)}
													{record.reviewNote && (
														<p className="m-0 text-[12px] text-text-3">Rejected: {record.reviewNote}</p>
													)}

													<RegistrationSummary
														registration={record.registration}
														application={record.application}
													/>

													{reviewable &&
														(rejecting?.id === record.id ? (
															<div className="flex flex-col gap-2">
																<textarea
																	rows={2}
																	autoFocus
																	aria-label="Rejection reason"
																	placeholder="Why is this registration rejected?"
																	className={cx(inputClass(undefined), 'resize-y')}
																	value={rejecting.note}
																	onChange={(event) =>
																		setRejecting({ id: record.id, note: event.target.value })
																	}
																/>
																<div className="flex gap-2">
																	<Button
																		variant="danger"
																		disabled={busy || !rejecting.note.trim()}
																		onClick={() => void act(record.id, 'reject', { note: rejecting.note })}
																	>
																		{busy && <Loader2 size={12} className="animate-spin" />}
																		Reject registration
																	</Button>
																	<Button variant="ghost" onClick={() => setRejecting(null)}>
																		Cancel
																	</Button>
																</div>
															</div>
														) : (
															<div className="flex flex-wrap gap-2">
																<Button disabled={busy} onClick={() => void act(record.id, 'approve')}>
																	{busy && <Loader2 size={12} className="animate-spin" />}
																	{record.status === 'failed' ? 'Retry agent creation' : 'Approve and create agent'}
																</Button>
																<Button
																	variant="danger-soft"
																	disabled={busy}
																	onClick={() => setRejecting({ id: record.id, note: '' })}
																>
																	Reject
																</Button>
															</div>
														))}

													{actionError?.id === record.id && (
														<p role="alert" className="m-0 text-[12px] text-red-500">
															{actionError.message}
														</p>
													)}
												</div>
											)}
										</li>
									);
								})}
							</ul>
						</section>
					))}
				</div>
			)}
		</Page>
	);
}
