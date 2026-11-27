import type { TextqlRpcPublicConnectorConnector } from '@textql/sdk/models';

import {
	assessRisk,
	registrationSchema,
	fieldErrors,
	type ApplicationRecord,
	type Connector,
	type FieldErrors,
	type Registration,
	type RegistrationRecord,
	type ReviewRoute,
	type RiskAssessment,
	type ValidationResponse
} from '../src/lib/registration';
import { sampleDirectory } from './directory';
import { createApi, HttpError, type Handler } from './http';
import { findRecord, listRecords, saveRecord } from './store';
import { isConnectError, textql } from './textql';

const directory = sampleDirectory;

function text(value: unknown): string {
	return typeof value === 'string' ? value.trim() : '';
}

function routeFor(risk: RiskAssessment): ReviewRoute {
	return process.env.REQUIRE_REVIEW === 'true' || risk.tier !== 'low' ? 'review' : 'auto';
}

async function agentNameTaken(name: string): Promise<string | null> {
	const wanted = name.toLowerCase();
	const records = await listRecords();
	if (
		records.some(
			(record) =>
				record.status !== 'rejected' && record.registration.agentName.toLowerCase() === wanted
		)
	) {
		return 'Another registration already uses this agent name.';
	}

	const result = await textql().agents.list({ body: { includeInactive: true } });
	if (isConnectError(result)) throw new HttpError(502, result.message ?? 'Unable to list agents.');
	if ((result.agents ?? []).some((agent) => agent.name?.trim().toLowerCase() === wanted)) {
		return 'An agent with this name already exists in TextQL.';
	}
	return null;
}

type Validation =
	| {
			ok: true;
			registration: Registration;
			application: ApplicationRecord;
			risk: RiskAssessment;
			route: ReviewRoute;
	  }
	| { ok: false; errors: FieldErrors; application: ApplicationRecord | null };

/**
 * Schema first, then the directory and TextQL checks for every identity field
 * the schema accepted. Runs on each step of the form and again on submit, so a
 * registration is never stored without passing all of it.
 */
async function validate(raw: unknown): Promise<Validation> {
	const parsed = registrationSchema.safeParse(raw);
	const errors: FieldErrors = parsed.success ? {} : fieldErrors(parsed.error);
	const input = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};

	const code = text(input.applicationCode).toUpperCase();
	const application =
		code && !errors.applicationCode ? await directory.lookupApplication(code) : null;
	if (code && !errors.applicationCode && !application) {
		errors.applicationCode = `No application is registered under ${code}.`;
	}

	const agentName = text(input.agentName);
	const [apmError, tgovError, nameError] = await Promise.all([
		application && !errors.apmId ? directory.validateApmId(text(input.apmId), code) : null,
		application && !errors.tgovId ? directory.validateTgovId(text(input.tgovId), code) : null,
		agentName && !errors.agentName ? agentNameTaken(agentName) : null
	]);
	if (apmError) errors.apmId = apmError;
	if (tgovError) errors.tgovId = tgovError;
	if (nameError) errors.agentName = nameError;

	if (!parsed.success || !application || Object.keys(errors).length > 0) {
		return { ok: false, errors, application };
	}
	const risk = assessRisk(parsed.data);
	return { ok: true, registration: parsed.data, application, risk, route: routeFor(risk) };
}

async function createAgent(registration: Registration): Promise<string> {
	const result = await textql().agents.create({
		body: {
			name: registration.agentName,
			prompt: registration.instructions,
			paradigmOptions: {
				universal: {
					sqlEnabled: true,
					pythonEnabled: true,
					connectorIds: registration.connectorIds
				}
			}
		}
	});
	if (isConnectError(result)) throw new Error(result.message ?? 'Agent creation failed.');
	const agentId = result.agent?.id;
	if (!agentId) throw new Error('Agent creation returned no agent ID.');
	return agentId;
}

/** Creates the agent for a validated record and stores the outcome, success or failure. */
async function provision(record: RegistrationRecord): Promise<RegistrationRecord> {
	const updatedAt = new Date().toISOString();
	try {
		const agentId = await createAgent(record.registration);
		return saveRecord({ ...record, status: 'created', agentId, error: null, updatedAt });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Agent creation failed.';
		return saveRecord({ ...record, status: 'failed', error: message, updatedAt });
	}
}

function newRegistrationId(): string {
	return `REG-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

// ─── Handlers ───────────────────────────────────────────────────────────────

const lookupApplication: Handler = async ({ params }) => {
	const application = await directory.lookupApplication(params.code ?? '');
	if (!application) throw new HttpError(404, `No application is registered under ${params.code}.`);
	return { application };
};

const listConnectors: Handler = async () => {
	const result = await textql().connectors.getConnectors({ body: {} });
	if (isConnectError(result)) throw new HttpError(502, result.message ?? 'Unable to load connectors.');
	const connectors: TextqlRpcPublicConnectorConnector[] =
		'connectors' in result && Array.isArray(result.connectors) ? result.connectors : [];

	return {
		connectors: connectors.flatMap((connector): Connector[] =>
			typeof connector.id === 'number' && connector.name?.trim()
				? [
						{
							id: connector.id,
							name: connector.name.trim(),
							type: typeof connector.connectorType === 'string' ? connector.connectorType : 'UNKNOWN'
						}
					]
				: []
		)
	};
};

const validateRegistration: Handler = async ({ body }) => {
	const result = await validate(body);
	const response: ValidationResponse = result.ok
		? { errors: {}, application: result.application, risk: result.risk, route: result.route }
		: { errors: result.errors, application: result.application, risk: null, route: null };
	return response;
};

const submitRegistration: Handler = async ({ body }) => {
	const result = await validate(body);
	if (!result.ok) {
		throw new HttpError(422, 'Some answers need attention.', { errors: result.errors });
	}

	const now = new Date().toISOString();
	const record: RegistrationRecord = {
		id: newRegistrationId(),
		status: 'pending_review',
		createdAt: now,
		updatedAt: now,
		registration: result.registration,
		application: result.application,
		risk: result.risk,
		route: result.route,
		agentId: null,
		reviewNote: null,
		error: null
	};

	return { registration: result.route === 'auto' ? await provision(record) : await saveRecord(record) };
};

const listRegistrations: Handler = async () => {
	const records = await listRecords();
	return { registrations: records.sort((a, b) => b.createdAt.localeCompare(a.createdAt)) };
};

async function reviewable(id: string | undefined): Promise<RegistrationRecord> {
	const record = id ? await findRecord(id) : null;
	if (!record) throw new HttpError(404, `Registration ${id} was not found.`);
	if (record.status !== 'pending_review' && record.status !== 'failed') {
		throw new HttpError(409, `Registration ${record.id} is already ${record.status.replace('_', ' ')}.`);
	}
	return record;
}

// No auth here: in a real deployment, gate approve and reject to your
// governance admins before exposing this server.
const approveRegistration: Handler = async ({ params }) => {
	return { registration: await provision(await reviewable(params.id)) };
};

const rejectRegistration: Handler = async ({ params, body }) => {
	const record = await reviewable(params.id);
	const note = typeof body === 'object' && body !== null ? text((body as { note?: unknown }).note) : '';
	if (!note) throw new HttpError(400, 'Say why the registration is rejected.');
	return {
		registration: await saveRecord({
			...record,
			status: 'rejected',
			reviewNote: note,
			updatedAt: new Date().toISOString()
		})
	};
};

export const api = createApi([
	{ method: 'GET', path: '/api/applications/:code', handler: lookupApplication },
	{ method: 'GET', path: '/api/connectors', handler: listConnectors },
	{ method: 'POST', path: '/api/registrations/validate', handler: validateRegistration },
	{ method: 'GET', path: '/api/registrations', handler: listRegistrations },
	{ method: 'POST', path: '/api/registrations', handler: submitRegistration },
	{ method: 'POST', path: '/api/registrations/:id/approve', handler: approveRegistration },
	{ method: 'POST', path: '/api/registrations/:id/reject', handler: rejectRegistration }
]);
