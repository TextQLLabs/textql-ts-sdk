import { z } from 'zod';

/**
 * The governance metadata every agent registers with. The server and the form
 * share this one schema, so a field the browser accepts is a field the server
 * accepts.
 */

type Option = { readonly value: string; readonly label: string; readonly hint?: string };
type ValueOf<T extends readonly Option[]> = T[number]['value'];

function enumOf<const T extends readonly Option[]>(options: T, error: string) {
	const values = options.map((option) => option.value) as unknown as [ValueOf<T>, ...ValueOf<T>[]];
	return z.enum(values, { error });
}

export function labelFor(options: readonly Option[], value: string): string {
	return options.find((option) => option.value === value)?.label ?? value;
}

export const AUTOMATIC_DECISIONS = [
	{ value: 'yes', label: 'Yes', hint: 'It acts or decides without a person approving each outcome.' },
	{ value: 'no', label: 'No', hint: 'A person reviews its output before anything happens.' }
] as const satisfies readonly Option[];

export const IMPACT_LEVELS = [
	{ value: 'low', label: 'Low', hint: 'Mistakes are easy to spot and cost little.' },
	{ value: 'medium', label: 'Medium', hint: 'Mistakes reach a team or a business process before anyone catches them.' },
	{ value: 'high', label: 'High', hint: 'Mistakes can affect customers, money, or regulatory standing.' }
] as const satisfies readonly Option[];

export const DATA_CLASSIFICATIONS = [
	{ value: 'no_sensitive', label: 'No Sensitive Data' },
	{ value: 'anonymized_pii', label: 'Anonymized PII' },
	{ value: 'deidentified_phi', label: 'De-Identified PHI' },
	{ value: 'limited_data_set', label: 'Limited Data Set' },
	{ value: 'non_elv_csi', label: 'Non-ELV CSI' },
	{ value: 'phi_pii', label: 'PHI/PII' },
	{ value: 'pci_pfi', label: 'PCI/PFI' },
	{ value: 'synthetic', label: 'Synthetic Data Sets' }
] as const satisfies readonly Option[];

export const DATA_INPUTS = [
	{ value: 'user_prompts', label: 'User prompts' },
	{ value: 'structured_enterprise', label: 'Structured enterprise data' },
	{ value: 'unstructured_documents', label: 'Unstructured documents' },
	{ value: 'claims', label: 'Claims' },
	{ value: 'clinical', label: 'Clinical' },
	{ value: 'member', label: 'Member' },
	{ value: 'provider', label: 'Provider' },
	{ value: 'financial', label: 'Financial' },
	{ value: 'api_payloads', label: 'API payloads' },
	{ value: 'realtime_events', label: 'Real-time event stream' },
	{ value: 'synthetic', label: 'Synthetic' },
	{ value: 'other', label: 'Other' }
] as const satisfies readonly Option[];

export const SENSITIVE_DATA_HANDLING = [
	{ value: 'yes', label: 'Yes' },
	{ value: 'no', label: 'No' },
	{ value: 'not_applicable', label: 'Not applicable' }
] as const satisfies readonly Option[];

export const DATA_SHARING = [
	{ value: 'none', label: 'No, all processing stays within the hosting environment' },
	{ value: 'enterprise_internal', label: 'Yes, to enterprise internal systems' },
	{ value: 'external_vendor', label: 'Yes, to an external vendor' },
	{ value: 'not_sure', label: 'Not sure' }
] as const satisfies readonly Option[];

export type DataClassification = ValueOf<typeof DATA_CLASSIFICATIONS>;

const SENSITIVE_CLASSIFICATIONS = new Set<string>([
	'limited_data_set',
	'non_elv_csi',
	'phi_pii',
	'pci_pfi'
] satisfies DataClassification[]);

const PHI_BEARING_INPUTS = new Set<string>(['claims', 'clinical', 'member']);

const required = (message: string) => z.string().trim().min(1, message);

export const registrationSchema = z
	.object({
		applicationCode: required('Enter the application code.').transform((code) => code.toUpperCase()),
		agentName: z
			.string()
			.trim()
			.min(3, 'Use at least 3 characters.')
			.max(80, 'Keep the name under 80 characters.'),
		apmId: required('Enter the APM ID.'),
		tgovId: required('Enter the TGov ID.'),
		instructions: z
			.string()
			.trim()
			.min(20, 'Describe what the agent should do in at least a sentence.'),
		dataClassification: enumOf(
			DATA_CLASSIFICATIONS,
			'Choose the most sensitive classification the agent touches.'
		),
		dataInputs: z
			.array(enumOf(DATA_INPUTS, 'Unknown data input.'))
			.min(1, 'Choose at least one input.'),
		dataInputsOther: z.string().trim().max(200, 'Keep this under 200 characters.'),
		dataOutputs: z
			.string()
			.trim()
			.min(10, 'Describe what the agent produces.')
			.max(1000, 'Keep this under 1000 characters.'),
		connectorIds: z.array(z.number().int().positive()),
		automaticDecisions: enumOf(AUTOMATIC_DECISIONS, 'Choose yes or no.'),
		impact: enumOf(IMPACT_LEVELS, 'Choose an impact level.'),
		transformsSensitiveData: enumOf(SENSITIVE_DATA_HANDLING, 'Choose an answer.'),
		externalDataSharing: enumOf(DATA_SHARING, 'Choose where the data goes.')
	})
	.superRefine((registration, ctx) => {
		if (registration.dataInputs.includes('other') && !registration.dataInputsOther) {
			ctx.addIssue({
				code: 'custom',
				path: ['dataInputsOther'],
				message: 'Describe the other input.'
			});
		}

		const phiInputs = registration.dataInputs.filter((input) => PHI_BEARING_INPUTS.has(input));
		if (phiInputs.length > 0 && registration.dataClassification === 'no_sensitive') {
			const names = phiInputs.map((input) => labelFor(DATA_INPUTS, input)).join(', ');
			ctx.addIssue({
				code: 'custom',
				path: ['dataClassification'],
				message: `${names} data usually carries PHI or PII, so "No Sensitive Data" does not fit.`
			});
		}

		if (
			SENSITIVE_CLASSIFICATIONS.has(registration.dataClassification) &&
			registration.transformsSensitiveData === 'not_applicable'
		) {
			ctx.addIssue({
				code: 'custom',
				path: ['transformsSensitiveData'],
				message: `The agent handles ${labelFor(DATA_CLASSIFICATIONS, registration.dataClassification)} data, so answer yes or no.`
			});
		}
	});

export type Registration = z.output<typeof registrationSchema>;

/** What the form holds before validation: every choice starts blank. */
export type Draft = {
	applicationCode: string;
	agentName: string;
	apmId: string;
	tgovId: string;
	instructions: string;
	dataClassification: string;
	dataInputs: string[];
	dataInputsOther: string;
	dataOutputs: string;
	connectorIds: number[];
	automaticDecisions: string;
	impact: string;
	transformsSensitiveData: string;
	externalDataSharing: string;
};

export const EMPTY_DRAFT: Draft = {
	applicationCode: '',
	agentName: '',
	apmId: '',
	tgovId: '',
	instructions: '',
	dataClassification: '',
	dataInputs: [],
	dataInputsOther: '',
	dataOutputs: '',
	connectorIds: [],
	automaticDecisions: '',
	impact: '',
	transformsSensitiveData: '',
	externalDataSharing: ''
};

export type FieldName = keyof Draft;
export type FieldErrors = Partial<Record<FieldName, string>>;

function isFieldName(value: PropertyKey | undefined): value is FieldName {
	return typeof value === 'string' && value in EMPTY_DRAFT;
}

export function fieldErrors(error: z.ZodError): FieldErrors {
	const errors: FieldErrors = {};
	for (const issue of error.issues) {
		const field = issue.path[0];
		if (isFieldName(field) && !errors[field]) errors[field] = issue.message;
	}
	return errors;
}

export function validateLocally(draft: Draft): FieldErrors {
	const result = registrationSchema.safeParse(draft);
	return result.success ? {} : fieldErrors(result.error);
}

// ─── Risk ───────────────────────────────────────────────────────────────────

export type RiskTier = 'low' | 'medium' | 'high';
export type RiskAssessment = { tier: RiskTier; reasons: string[] };

/**
 * Placeholder policy until governance confirms the real one: anything that
 * decides on its own, has high impact, or can move sensitive data off-platform
 * is high; any other sensitive signal is medium.
 */
export function assessRisk(registration: Registration): RiskAssessment {
	const high: string[] = [];
	const medium: string[] = [];
	const classification = labelFor(DATA_CLASSIFICATIONS, registration.dataClassification);
	const sensitive = SENSITIVE_CLASSIFICATIONS.has(registration.dataClassification);
	const sharing = registration.externalDataSharing;

	if (registration.automaticDecisions === 'yes') high.push('Makes automatic decisions');
	if (registration.impact === 'high') high.push('High agent impact');
	if (sensitive && (sharing === 'external_vendor' || sharing === 'not_sure')) {
		high.push(`${classification} data may leave the hosting environment`);
	}

	if (registration.impact === 'medium') medium.push('Medium agent impact');
	if (sensitive) medium.push(`Handles ${classification} data`);
	if (registration.transformsSensitiveData === 'yes') {
		medium.push('Transforms or generates personal or sensitive data');
	}
	if (sharing === 'enterprise_internal') medium.push('Sends data to other enterprise systems');
	if (sharing === 'external_vendor') medium.push('Sends data to an external vendor');
	if (sharing === 'not_sure') medium.push('Data destinations are unknown');

	const tier: RiskTier = high.length > 0 ? 'high' : medium.length > 0 ? 'medium' : 'low';
	return { tier, reasons: [...high, ...medium] };
}

/** `auto` creates the agent on submit. `review` opens a ticket an admin approves. */
export type ReviewRoute = 'auto' | 'review';

// ─── API shapes ─────────────────────────────────────────────────────────────

/** What the application directory knows about an application code. */
export type ApplicationRecord = {
	applicationCode: string;
	name: string;
	apmId: string;
	tgovIds: string[];
	lineOfBusiness: string;
	team: string;
	owner: string;
	productOwner: string;
	vpName: string;
	dataClassification: DataClassification | null;
};

export type Connector = { id: number; name: string; type: string };

export type ValidationResponse = {
	errors: FieldErrors;
	application: ApplicationRecord | null;
	risk: RiskAssessment | null;
	route: ReviewRoute | null;
};

export type RegistrationStatus = 'pending_review' | 'created' | 'rejected' | 'failed';

export type RegistrationRecord = {
	id: string;
	status: RegistrationStatus;
	createdAt: string;
	updatedAt: string;
	registration: Registration;
	application: ApplicationRecord;
	risk: RiskAssessment;
	route: ReviewRoute;
	agentId: string | null;
	reviewNote: string | null;
	error: string | null;
};
