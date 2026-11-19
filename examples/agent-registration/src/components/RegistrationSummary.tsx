import type { ReactNode } from 'react';

import { cx } from '../lib/cx';
import {
	AUTOMATIC_DECISIONS,
	DATA_CLASSIFICATIONS,
	DATA_INPUTS,
	DATA_SHARING,
	IMPACT_LEVELS,
	SENSITIVE_DATA_HANDLING,
	labelFor,
	type ApplicationRecord,
	type Registration,
	type RegistrationStatus,
	type RiskTier
} from '../lib/registration';

const TIER_STYLES: Record<RiskTier, string> = {
	low: 'bg-emerald-500/12 text-emerald-600',
	medium: 'bg-amber-500/14 text-amber-600',
	high: 'bg-red-500/12 text-red-500'
};

export function RiskBadge({ tier }: { tier: RiskTier }) {
	return (
		<span
			className={cx(
				'inline-flex items-center rounded-xs px-1.5 py-px font-mono text-[10.5px] tracking-wide uppercase',
				TIER_STYLES[tier]
			)}
		>
			{tier} risk
		</span>
	);
}

const STATUS_LABELS: Record<RegistrationStatus, string> = {
	pending_review: 'Pending review',
	created: 'Agent created',
	rejected: 'Rejected',
	failed: 'Creation failed'
};

const STATUS_DOTS: Record<RegistrationStatus, string> = {
	pending_review: 'bg-amber-500',
	created: 'bg-emerald-500',
	rejected: 'bg-muted',
	failed: 'bg-red-500'
};

export function StatusLabel({ status }: { status: RegistrationStatus }) {
	return (
		<span className="inline-flex items-center gap-1.5 text-[11.5px] text-text-3">
			<span className="relative flex size-1.5">
				{status === 'pending_review' && (
					<span className="absolute inset-0 animate-status-ping rounded-full bg-amber-500" />
				)}
				<span className={cx('relative size-1.5 rounded-full', STATUS_DOTS[status])} />
			</span>
			{STATUS_LABELS[status]}
		</span>
	);
}

function Section({ title, children }: { title: string; children: ReactNode }) {
	return (
		<section className="flex flex-col gap-2">
			<h3 className="m-0 font-mono text-[10.5px] font-medium tracking-wider text-muted uppercase">
				{title}
			</h3>
			<dl className="m-0 grid grid-cols-[minmax(140px,200px)_1fr] gap-x-4 gap-y-1.5 max-[560px]:grid-cols-1">
				{children}
			</dl>
		</section>
	);
}

function Row({ label, children }: { label: string; children: ReactNode }) {
	return (
		<>
			<dt className="text-[12px] text-muted">{label}</dt>
			<dd className="m-0 min-w-0 text-[12.5px] break-words text-ink max-[560px]:mb-1.5">{children}</dd>
		</>
	);
}

const MONO = 'font-mono text-[12px]';

type Props = {
	registration: Registration;
	application: ApplicationRecord;
	connectorNames?: Map<number, string>;
};

export function RegistrationSummary({ registration, application, connectorNames }: Props) {
	const inputs = registration.dataInputs
		.map((input) =>
			input === 'other' ? `Other (${registration.dataInputsOther})` : labelFor(DATA_INPUTS, input)
		)
		.join(', ');
	const connectors = registration.connectorIds
		.map((id) => connectorNames?.get(id) ?? `Connector ${id}`)
		.join(', ');

	return (
		<div className="flex flex-col gap-5">
			<Section title="Agent">
				<Row label="Agent name">{registration.agentName}</Row>
				<Row label="Application code">
					<span className={MONO}>{registration.applicationCode}</span>
					<span className="text-muted"> · {application.name}</span>
				</Row>
				<Row label="APM ID">
					<span className={MONO}>{registration.apmId}</span>
				</Row>
				<Row label="TGov ID">
					<span className={MONO}>{registration.tgovId}</span>
				</Row>
				<Row label="Owner">
					{application.owner}
					<span className="text-muted">
						{' '}
						· {application.team}, {application.lineOfBusiness}
					</span>
				</Row>
				<Row label="Instructions">
					<span className="whitespace-pre-wrap">{registration.instructions}</span>
				</Row>
			</Section>

			<Section title="Data">
				<Row label="Data classification">
					{labelFor(DATA_CLASSIFICATIONS, registration.dataClassification)}
				</Row>
				<Row label="Data inputs">{inputs}</Row>
				<Row label="Data outputs">
					<span className="whitespace-pre-wrap">{registration.dataOutputs}</span>
				</Row>
				<Row label="Connectors">{connectors || <span className="text-muted">None</span>}</Row>
			</Section>

			<Section title="Risk">
				<Row label="Automatic decisions">
					{labelFor(AUTOMATIC_DECISIONS, registration.automaticDecisions)}
				</Row>
				<Row label="Agent impact">{labelFor(IMPACT_LEVELS, registration.impact)}</Row>
				<Row label="Transforms sensitive data">
					{labelFor(SENSITIVE_DATA_HANDLING, registration.transformsSensitiveData)}
				</Row>
				<Row label="Data leaves hosting">
					{labelFor(DATA_SHARING, registration.externalDataSharing)}
				</Row>
			</Section>
		</div>
	);
}
