import {
	ArrowLeft,
	ArrowRight,
	Check,
	CheckCircle2,
	CircleAlert,
	Clock,
	Loader2,
	Search,
	ShieldCheck
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { ApiError, api, errorMessage } from '../lib/api';
import { cx } from '../lib/cx';
import {
	AUTOMATIC_DECISIONS,
	DATA_CLASSIFICATIONS,
	DATA_INPUTS,
	DATA_SHARING,
	EMPTY_DRAFT,
	IMPACT_LEVELS,
	SENSITIVE_DATA_HANDLING,
	registrationSchema,
	validateLocally,
	type ApplicationRecord,
	type Connector,
	type Draft,
	type FieldErrors,
	type FieldName,
	type RegistrationRecord,
	type ValidationResponse
} from '../lib/registration';
import { Button, Page } from '../primitives';
import { ChipGroup, ChoiceGroup, Field, SourceBadge, inputClass } from './fields';
import { RegistrationSummary, RiskBadge } from './RegistrationSummary';

type Step = { id: 'agent' | 'data' | 'risk' | 'review'; title: string; lead: string; fields: FieldName[] };

const STEPS: Step[] = [
	{
		id: 'agent',
		title: 'Agent',
		lead: 'Identify the agent and the application that owns it.',
		fields: ['applicationCode', 'agentName', 'apmId', 'tgovId', 'instructions']
	},
	{
		id: 'data',
		title: 'Data',
		lead: 'What the agent reads, what it produces, and which sources it can query.',
		fields: ['dataClassification', 'dataInputs', 'dataInputsOther', 'dataOutputs', 'connectorIds']
	},
	{
		id: 'risk',
		title: 'Risk',
		lead: 'How far the agent can act on its own and where its data goes.',
		fields: ['automaticDecisions', 'impact', 'transformsSensitiveData', 'externalDataSharing']
	},
	{
		id: 'review',
		title: 'Review',
		lead: 'Every answer has passed validation. Check it over, then submit.',
		fields: []
	}
];

const REVIEW_STEP = STEPS.length - 1;

function pick(errors: FieldErrors, fields: readonly FieldName[]): FieldErrors {
	const picked: FieldErrors = {};
	for (const field of fields) if (errors[field]) picked[field] = errors[field];
	return picked;
}

const hasErrors = (errors: FieldErrors) => Object.keys(errors).length > 0;

const firstStepWithError = (errors: FieldErrors) =>
	STEPS.findIndex((step) => step.fields.some((field) => errors[field]));

function toggle<T>(list: readonly T[], value: T): T[] {
	return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

type Lookup = { status: 'idle' | 'loading' | 'error'; code: string; message?: string };

export function RegisterPage() {
	const navigate = useNavigate();
	const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
	const [step, setStep] = useState(0);
	const [errors, setErrors] = useState<FieldErrors>({});
	const [formError, setFormError] = useState<string | null>(null);
	const [checking, setChecking] = useState(false);
	const [application, setApplication] = useState<ApplicationRecord | null>(null);
	const [lookup, setLookup] = useState<Lookup>({ status: 'idle', code: '' });
	const [autofilled, setAutofilled] = useState<FieldName[]>([]);
	const [connectors, setConnectors] = useState<Connector[] | null>(null);
	const [connectorsError, setConnectorsError] = useState<string | null>(null);
	const [review, setReview] = useState<ValidationResponse | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [result, setResult] = useState<RegistrationRecord | null>(null);

	useEffect(() => {
		api<{ connectors: Connector[] }>('/api/connectors')
			.then((response) => setConnectors(response.connectors))
			.catch((error: unknown) => {
				setConnectors([]);
				setConnectorsError(errorMessage(error));
			});
	}, []);

	const parsed = useMemo(() => registrationSchema.safeParse(draft), [draft]);
	const connectorNames = useMemo(
		() => new Map((connectors ?? []).map((connector) => [connector.id, connector.name])),
		[connectors]
	);

	function clearErrors(fields: FieldName[]) {
		setErrors((current) => {
			const next = { ...current };
			for (const field of fields) delete next[field];
			return next;
		});
	}

	function update<K extends FieldName>(field: K, value: Draft[K]) {
		setDraft((current) => ({ ...current, [field]: value }));
		clearErrors([field]);
		setAutofilled((current) => current.filter((item) => item !== field));
	}

	function updateApplicationCode(value: string) {
		update('applicationCode', value);
		if (value.trim().toUpperCase() !== lookup.code) {
			setApplication(null);
			setLookup({ status: 'idle', code: '' });
		}
	}

	async function lookupApplication() {
		const code = draft.applicationCode.trim().toUpperCase();
		if (!code) return;
		setLookup({ status: 'loading', code });

		try {
			const response = await api<{ application: ApplicationRecord }>(
				`/api/applications/${encodeURIComponent(code)}`
			);
			const found = response.application;
			const filled: Partial<Draft> = { apmId: found.apmId, tgovId: found.tgovIds[0] ?? '' };
			if (found.dataClassification && !draft.dataClassification) {
				filled.dataClassification = found.dataClassification;
			}

			setApplication(found);
			setLookup({ status: 'idle', code });
			setDraft((current) => ({ ...current, applicationCode: code, ...filled }));
			setAutofilled(Object.keys(filled) as FieldName[]);
			clearErrors(['applicationCode', ...(Object.keys(filled) as FieldName[])]);
		} catch (error) {
			setApplication(null);
			setLookup({ status: 'error', code, message: errorMessage(error) });
		}
	}

	async function next() {
		const fields = STEPS[step]!.fields;
		setFormError(null);

		const localErrors = pick(validateLocally(draft), fields);
		if (hasErrors(localErrors)) {
			setErrors(localErrors);
			return;
		}

		setChecking(true);
		try {
			const response = await api<ValidationResponse>('/api/registrations/validate', draft);
			const stepErrors = pick(response.errors, fields);
			if (hasErrors(stepErrors)) {
				setErrors(stepErrors);
				return;
			}
			if (response.application) setApplication(response.application);
			setErrors({});

			if (step + 1 === REVIEW_STEP) {
				const earlier = firstStepWithError(response.errors);
				if (earlier !== -1) {
					setStep(earlier);
					setErrors(pick(response.errors, STEPS[earlier]!.fields));
					return;
				}
				setReview(response);
			}
			setStep(step + 1);
		} catch (error) {
			setFormError(errorMessage(error));
		} finally {
			setChecking(false);
		}
	}

	async function submit() {
		setSubmitting(true);
		setFormError(null);
		try {
			const response = await api<{ registration: RegistrationRecord }>('/api/registrations', draft);
			setResult(response.registration);
		} catch (error) {
			setFormError(errorMessage(error));
			if (error instanceof ApiError && typeof error.payload.errors === 'object' && error.payload.errors) {
				const serverErrors = error.payload.errors as FieldErrors;
				const index = firstStepWithError(serverErrors);
				if (index !== -1) {
					setStep(index);
					setErrors(pick(serverErrors, STEPS[index]!.fields));
				}
			}
		} finally {
			setSubmitting(false);
		}
	}

	function reset() {
		setDraft(EMPTY_DRAFT);
		setStep(0);
		setErrors({});
		setFormError(null);
		setApplication(null);
		setLookup({ status: 'idle', code: '' });
		setAutofilled([]);
		setReview(null);
		setResult(null);
	}

	const lead =
		'Answer the governance questions once. Each answer is checked against the application directory before the agent exists.';

	if (result) {
		return (
			<Page title="Register an agent" lead={lead}>
				<ResultPanel
					record={result}
					onReset={reset}
					onViewAll={() => navigate('/registrations')}
				/>
			</Page>
		);
	}

	const current = STEPS[step]!;
	const fromApm = (field: FieldName) =>
		autofilled.includes(field) ? <SourceBadge>From APM</SourceBadge> : null;

	return (
		<Page title="Register an agent" lead={lead}>
			<div className="flex flex-col gap-5">
				<ol className="m-0 flex list-none flex-wrap gap-1 p-0">
					{STEPS.map((item, index) => {
						const done = index < step;
						return (
							<li key={item.id}>
								<button
									type="button"
									disabled={!done}
									onClick={() => {
										setErrors({});
										setFormError(null);
										setStep(index);
									}}
									className={cx(
										'flex items-center gap-2 rounded-sm border-0 px-2.5 py-1.5 text-[12.5px] transition-colors',
										index === step
											? 'bg-elevate text-ink shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-line)_75%,transparent)]'
											: done
												? 'cursor-pointer bg-transparent text-text-3 hover:bg-elevate/60 hover:text-ink'
												: 'bg-transparent text-muted'
									)}
								>
									<span className="font-mono text-[11px] text-muted">
										{String(index + 1).padStart(2, '0')}
									</span>
									{item.title}
									{done && <Check size={12} strokeWidth={2} className="text-accent" />}
								</button>
							</li>
						);
					})}
				</ol>

				<div className="flex flex-col gap-1">
					<h2 className="m-0 text-[15px] font-medium text-ink">{current.title}</h2>
					<p className="m-0 text-[12.5px] leading-[1.45] text-muted">{current.lead}</p>
				</div>

				<div
					key={current.id}
					className="flex animate-modal-reveal flex-col gap-5 rounded-md border border-line/80 bg-elevate p-5 max-[560px]:p-4"
				>
					{current.id === 'agent' && (
						<>
							<Field
								label="Application code"
								htmlFor="applicationCode"
								hint="Looks up the application's APM record, owners, and TGov registrations."
								error={errors.applicationCode ?? (lookup.status === 'error' ? lookup.message : undefined)}
							>
								<div className="flex gap-2">
									<input
										id="applicationCode"
										autoComplete="off"
										placeholder="e.g. CLMX"
										className={cx(inputClass(errors.applicationCode), 'font-mono uppercase')}
										value={draft.applicationCode}
										onChange={(event) => updateApplicationCode(event.target.value)}
										onBlur={() => {
											const code = draft.applicationCode.trim().toUpperCase();
											if (code && code !== lookup.code) void lookupApplication();
										}}
										onKeyDown={(event) => {
											if (event.key !== 'Enter') return;
											event.preventDefault();
											void lookupApplication();
										}}
									/>
									<Button
										variant="surface"
										size="lg"
										className="shrink-0"
										disabled={!draft.applicationCode.trim() || lookup.status === 'loading'}
										onClick={() => void lookupApplication()}
									>
										{lookup.status === 'loading' ? (
											<Loader2 size={14} className="animate-spin" />
										) : (
											<Search size={14} />
										)}
										Look up
									</Button>
								</div>
							</Field>

							{application && <ApplicationCard application={application} />}

							<Field
								label="Agent name"
								htmlFor="agentName"
								hint="Unique across registrations and the agents already in TextQL."
								error={errors.agentName}
							>
								<input
									id="agentName"
									autoComplete="off"
									placeholder="e.g. Claims Denial Summarizer"
									className={inputClass(errors.agentName)}
									value={draft.agentName}
									onChange={(event) => update('agentName', event.target.value)}
								/>
							</Field>

							<div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
								<Field label="APM ID" htmlFor="apmId" error={errors.apmId} badge={fromApm('apmId')}>
									<input
										id="apmId"
										autoComplete="off"
										className={cx(inputClass(errors.apmId), 'font-mono')}
										value={draft.apmId}
										onChange={(event) => update('apmId', event.target.value)}
									/>
								</Field>
								<Field label="TGov ID" htmlFor="tgovId" error={errors.tgovId} badge={fromApm('tgovId')}>
									<input
										id="tgovId"
										autoComplete="off"
										className={cx(inputClass(errors.tgovId), 'font-mono')}
										value={draft.tgovId}
										onChange={(event) => update('tgovId', event.target.value)}
									/>
								</Field>
							</div>

							<Field
								label="Agent instructions"
								htmlFor="instructions"
								hint="The prompt the agent runs with once it is created."
								error={errors.instructions}
							>
								<textarea
									id="instructions"
									rows={4}
									className={cx(inputClass(errors.instructions), 'resize-y leading-[1.5]')}
									placeholder="Summarize last week's denied claims by denial reason and flag any reason that grew more than 20%."
									value={draft.instructions}
									onChange={(event) => update('instructions', event.target.value)}
								/>
							</Field>
						</>
					)}

					{current.id === 'data' && (
						<>
							<Field
								label="Data classification"
								hint="The most sensitive classification of any data the agent reads or writes."
								error={errors.dataClassification}
								badge={fromApm('dataClassification')}
							>
								<ChoiceGroup
									label="Data classification"
									columns={2}
									options={DATA_CLASSIFICATIONS}
									value={draft.dataClassification}
									onChange={(value) => update('dataClassification', value)}
									error={errors.dataClassification}
								/>
							</Field>

							<Field
								label="Data inputs"
								hint="Everything the agent reads. Choose all that apply."
								error={errors.dataInputs}
							>
								<ChipGroup<string>
									label="Data inputs"
									options={DATA_INPUTS}
									values={draft.dataInputs}
									onToggle={(value) => update('dataInputs', toggle(draft.dataInputs, value))}
									error={errors.dataInputs}
								/>
							</Field>

							{draft.dataInputs.includes('other') && (
								<Field label="Other inputs" htmlFor="dataInputsOther" error={errors.dataInputsOther}>
									<input
										id="dataInputsOther"
										autoComplete="off"
										className={inputClass(errors.dataInputsOther)}
										value={draft.dataInputsOther}
										onChange={(event) => update('dataInputsOther', event.target.value)}
									/>
								</Field>
							)}

							<Field
								label="Data outputs"
								htmlFor="dataOutputs"
								hint="What the agent produces and who receives it."
								error={errors.dataOutputs}
							>
								<textarea
									id="dataOutputs"
									rows={3}
									className={cx(inputClass(errors.dataOutputs), 'resize-y leading-[1.5]')}
									placeholder="A weekly summary table and chart, posted to the claims operations channel."
									value={draft.dataOutputs}
									onChange={(event) => update('dataOutputs', event.target.value)}
								/>
							</Field>

							<Field
								label="Connectors"
								hint="The data sources the agent may query. It gets no other data access."
								error={errors.connectorIds}
							>
								{connectors === null ? (
									<p className="m-0 flex items-center gap-2 text-[12px] text-muted">
										<Loader2 size={12} className="animate-spin" />
										Loading connectors
									</p>
								) : connectors.length === 0 ? (
									<p className="m-0 text-[12px] text-muted">
										{connectorsError ?? 'No connectors are available to this API key.'}
									</p>
								) : (
									<ChipGroup<number>
										label="Connectors"
										options={connectors.map((connector) => ({
											value: connector.id,
											label: connector.name,
											hint: connector.type
										}))}
										values={draft.connectorIds}
										onToggle={(id) => update('connectorIds', toggle(draft.connectorIds, id))}
									/>
								)}
							</Field>
						</>
					)}

					{current.id === 'risk' && (
						<>
							<Field label="Does this agent make automatic decisions?" error={errors.automaticDecisions}>
								<ChoiceGroup
									label="Automatic decisions"
									columns={2}
									options={AUTOMATIC_DECISIONS}
									value={draft.automaticDecisions}
									onChange={(value) => update('automaticDecisions', value)}
									error={errors.automaticDecisions}
								/>
							</Field>

							<Field
								label="Agent impact"
								hint="How far a wrong answer travels before a person catches it."
								error={errors.impact}
							>
								<ChoiceGroup
									label="Agent impact"
									columns={3}
									options={IMPACT_LEVELS}
									value={draft.impact}
									onChange={(value) => update('impact', value)}
									error={errors.impact}
								/>
							</Field>

							<Field
								label="Does this agent transform or generate personal or sensitive data?"
								error={errors.transformsSensitiveData}
							>
								<ChoiceGroup
									label="Transforms sensitive data"
									columns={3}
									options={SENSITIVE_DATA_HANDLING}
									value={draft.transformsSensitiveData}
									onChange={(value) => update('transformsSensitiveData', value)}
									error={errors.transformsSensitiveData}
								/>
							</Field>

							<Field
								label="Does this agent send data to systems or vendors outside its hosting environment?"
								error={errors.externalDataSharing}
							>
								<ChoiceGroup
									label="External data sharing"
									columns={2}
									options={DATA_SHARING}
									value={draft.externalDataSharing}
									onChange={(value) => update('externalDataSharing', value)}
									error={errors.externalDataSharing}
								/>
							</Field>
						</>
					)}

					{current.id === 'review' &&
						(parsed.success && review?.risk && review.route && review.application ? (
							<>
								<RouteCallout
									route={review.route}
									tier={review.risk.tier}
									reasons={review.risk.reasons}
								/>
								<RegistrationSummary
									registration={parsed.data}
									application={review.application}
									connectorNames={connectorNames}
								/>
							</>
						) : (
							<p className="m-0 text-[12.5px] text-muted">
								Some answers changed since they were checked. Go back a step and continue again.
							</p>
						))}
				</div>

				<div className="flex flex-wrap items-center justify-between gap-3">
					<Button
						variant="ghost"
						size="lg"
						disabled={step === 0 || checking || submitting}
						onClick={() => {
							setErrors({});
							setFormError(null);
							setStep(step - 1);
						}}
					>
						<ArrowLeft size={14} />
						Back
					</Button>
					<div className="flex items-center gap-3">
						{formError && (
							<span role="alert" className="text-[12px] text-red-500">
								{formError}
							</span>
						)}
						{step < REVIEW_STEP ? (
							<Button size="lg" disabled={checking} onClick={() => void next()}>
								{checking && <Loader2 size={14} className="animate-spin" />}
								{checking ? 'Checking' : 'Continue'}
								{!checking && <ArrowRight size={14} />}
							</Button>
						) : (
							<Button
								size="lg"
								disabled={submitting || !review?.route}
								onClick={() => void submit()}
							>
								{submitting && <Loader2 size={14} className="animate-spin" />}
								{review?.route === 'auto' ? 'Create agent' : 'Submit for review'}
							</Button>
						)}
					</div>
				</div>
			</div>
		</Page>
	);
}

function ApplicationCard({ application }: { application: ApplicationRecord }) {
	const facts = [
		['Application', application.name],
		['Line of business', application.lineOfBusiness],
		['Team', application.team],
		['Agent owner', application.owner],
		['Product owner', application.productOwner],
		['VP', application.vpName]
	];
	return (
		<div className="grid grid-cols-3 gap-x-4 gap-y-2.5 rounded-sm bg-fill px-3.5 py-3 max-[560px]:grid-cols-2">
			{facts.map(([label, value]) => (
				<div key={label} className="flex min-w-0 flex-col gap-px">
					<span className="font-mono text-[10px] tracking-wider text-muted uppercase">{label}</span>
					<span className="truncate text-[12.5px] text-ink">{value}</span>
				</div>
			))}
		</div>
	);
}

type RouteCalloutProps = {
	route: 'auto' | 'review';
	tier: 'low' | 'medium' | 'high';
	reasons: string[];
};

function RouteCallout({ route, tier, reasons }: RouteCalloutProps) {
	const auto = route === 'auto';
	const Icon = auto ? ShieldCheck : Clock;
	return (
		<div
			className={cx(
				'flex gap-3 rounded-sm px-3.5 py-3',
				auto ? 'bg-emerald-500/8' : 'bg-amber-500/10'
			)}
		>
			<Icon
				size={16}
				strokeWidth={1.75}
				className={cx('mt-0.5 shrink-0', auto ? 'text-emerald-500' : 'text-amber-500')}
			/>
			<div className="flex min-w-0 flex-col gap-1">
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-[13px] font-medium text-ink">
						{auto ? 'Passes every automated check' : 'Needs a governance review'}
					</span>
					<RiskBadge tier={tier} />
				</div>
				<p className="m-0 text-[12px] leading-[1.45] text-text-3">
					{auto
						? 'Submitting creates the agent in TextQL right away.'
						: 'Submitting opens a review ticket. The agent is created when an admin approves it.'}
				</p>
				{!auto && reasons.length === 0 && (
					<p className="m-0 text-[12px] text-text-3">This deployment reviews every registration.</p>
				)}
				{reasons.length > 0 && (
					<ul className="m-0 flex list-disc flex-col gap-0.5 pl-4 text-[12px] text-text-3">
						{reasons.map((reason) => (
							<li key={reason}>{reason}</li>
						))}
					</ul>
				)}
			</div>
		</div>
	);
}

type ResultPanelProps = {
	record: RegistrationRecord;
	onReset: () => void;
	onViewAll: () => void;
};

function ResultPanel({ record, onReset, onViewAll }: ResultPanelProps) {
	const name = record.registration.agentName;
	const outcome = {
		created: {
			icon: CheckCircle2,
			tone: 'text-emerald-500',
			title: 'Agent created',
			body: `${name} passed every check and now exists in TextQL.`
		},
		pending_review: {
			icon: Clock,
			tone: 'text-amber-500',
			title: 'Sent for review',
			body: `${record.id} is waiting on a governance admin. The agent is created when it is approved.`
		},
		failed: {
			icon: CircleAlert,
			tone: 'text-red-500',
			title: 'Validated, but the agent was not created',
			body: `TextQL returned: ${record.error ?? 'an unknown error'}. Retry it from Registrations.`
		},
		rejected: {
			icon: CircleAlert,
			tone: 'text-muted',
			title: 'Rejected',
			body: record.reviewNote ?? ''
		}
	}[record.status];
	const Icon = outcome.icon;

	return (
		<div className="flex animate-modal-reveal flex-col gap-5">
			<div className="flex flex-col gap-4 rounded-md border border-line/80 bg-elevate p-5">
				<div className="flex items-start gap-3">
					<Icon size={20} strokeWidth={1.75} className={cx('mt-px shrink-0', outcome.tone)} />
					<div className="flex min-w-0 flex-col gap-1">
						<h2 className="m-0 text-[15px] font-medium text-ink">{outcome.title}</h2>
						<p className="m-0 text-[12.5px] leading-[1.45] text-text-3">{outcome.body}</p>
					</div>
				</div>
				<dl className="m-0 grid grid-cols-[140px_1fr] gap-x-4 gap-y-1.5 text-[12.5px]">
					<dt className="text-muted">Registration</dt>
					<dd className="m-0 font-mono text-[12px] text-ink">{record.id}</dd>
					{record.agentId && (
						<>
							<dt className="text-muted">Agent ID</dt>
							<dd className="m-0 font-mono text-[12px] break-all text-ink">{record.agentId}</dd>
						</>
					)}
					<dt className="text-muted">Risk</dt>
					<dd className="m-0">
						<RiskBadge tier={record.risk.tier} />
					</dd>
				</dl>
			</div>
			<div className="flex flex-wrap gap-2">
				<Button size="lg" onClick={onReset}>
					Register another agent
				</Button>
				<Button variant="surface" size="lg" onClick={onViewAll}>
					View registrations
				</Button>
			</div>
		</div>
	);
}
