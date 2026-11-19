import type { ApplicationRecord } from '../src/lib/registration';

/**
 * The enterprise systems that own application metadata. Each method is one of
 * the lookup or validation APIs a registration is checked against. Replace
 * `sampleDirectory` with an implementation that calls your APIs; nothing else
 * in the example needs to change.
 */
export interface GovernanceDirectory {
	/** Pulls ownership, team, and compliance data for an application code, or null if unknown. */
	lookupApplication(applicationCode: string): Promise<ApplicationRecord | null>;
	/** An error message when the APM ID is unknown or belongs to another application. */
	validateApmId(apmId: string, applicationCode: string): Promise<string | null>;
	/** An error message when the TGov ID is unknown or not registered to the application. */
	validateTgovId(tgovId: string, applicationCode: string): Promise<string | null>;
}

const SAMPLE_APPLICATIONS: ApplicationRecord[] = [
	{
		applicationCode: 'CLMX',
		name: 'Claims Experience Platform',
		apmId: 'APM0004127',
		tgovIds: ['TGOV-2291', 'TGOV-2304'],
		lineOfBusiness: 'Commercial',
		team: 'Claims Engineering',
		owner: 'Dana Whitfield',
		productOwner: 'Marcus Lee',
		vpName: 'Priya Raman',
		dataClassification: 'phi_pii'
	},
	{
		applicationCode: 'PRVD',
		name: 'Provider Data Hub',
		apmId: 'APM0003318',
		tgovIds: ['TGOV-1875'],
		lineOfBusiness: 'Government Business',
		team: 'Provider Data Services',
		owner: 'Sam Okafor',
		productOwner: 'Elena Brooks',
		vpName: 'Robert Chen',
		dataClassification: 'limited_data_set'
	},
	{
		applicationCode: 'FINR',
		name: 'Finance Reporting Suite',
		apmId: 'APM0005560',
		tgovIds: ['TGOV-3012'],
		lineOfBusiness: 'Corporate Finance',
		team: 'Financial Systems',
		owner: 'Jordan Patel',
		productOwner: 'Alicia Gomez',
		vpName: 'Thomas Byrne',
		dataClassification: 'pci_pfi'
	},
	{
		applicationCode: 'MKTG',
		name: 'Engagement Analytics',
		apmId: 'APM0006021',
		tgovIds: ['TGOV-3127'],
		lineOfBusiness: 'Consumer',
		team: 'Digital Analytics',
		owner: 'Riley Nguyen',
		productOwner: 'Chris Morgan',
		vpName: 'Hannah Fischer',
		dataClassification: 'anonymized_pii'
	}
];

const byCode = (code: string) =>
	SAMPLE_APPLICATIONS.find((app) => app.applicationCode === code.trim().toUpperCase()) ?? null;

/** In-memory stand-in for the real directory APIs, seeded with the applications above. */
export const sampleDirectory: GovernanceDirectory = {
	async lookupApplication(applicationCode) {
		return byCode(applicationCode);
	},

	async validateApmId(apmId, applicationCode) {
		const owner = SAMPLE_APPLICATIONS.find((app) => app.apmId === apmId.trim().toUpperCase());
		if (!owner) return 'No application has this APM ID.';
		if (owner.applicationCode !== applicationCode.trim().toUpperCase()) {
			return `This APM ID belongs to ${owner.applicationCode}, not ${applicationCode.toUpperCase()}.`;
		}
		return null;
	},

	async validateTgovId(tgovId, applicationCode) {
		const id = tgovId.trim().toUpperCase();
		const owner = SAMPLE_APPLICATIONS.find((app) => app.tgovIds.includes(id));
		if (!owner) return 'No TGov record has this ID.';
		if (owner.applicationCode !== applicationCode.trim().toUpperCase()) {
			return `This TGov ID is registered to ${owner.applicationCode}, not ${applicationCode.toUpperCase()}.`;
		}
		return null;
	}
};
