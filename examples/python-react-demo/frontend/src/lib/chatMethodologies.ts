export const CHAT_METHODOLOGIES = [
	{
		id: 'METHODOLOGY_UNKNOWN',
		label: 'Server default',
		description: "Use the server's default methodology"
	},
	{
		id: 'METHODOLOGY_ADAPTIVE',
		label: 'Adaptive',
		description: 'Balancing speed & thoroughness'
	},
	{
		id: 'METHODOLOGY_PRESCRIPTIVE',
		label: 'Prescriptive',
		description: 'Makes assumptions, finds answers fast'
	},
	{
		id: 'METHODOLOGY_THOROUGH',
		label: 'Thorough',
		description: 'Makes no assumptions, explores all paths'
	},
	{
		id: 'METHODOLOGY_CAREFUL',
		label: 'Careful',
		description: 'Makes no assumptions, clarifies frequently'
	},
	{
		id: 'METHODOLOGY_ONTOLOGY_BUILDING',
		label: 'Ontology Building',
		description: 'Proactively builds your ontology with you'
	}
] as const;

export type ChatMethodology = (typeof CHAT_METHODOLOGIES)[number]['id'];

export function isKnownChatMethodology(value: unknown): value is ChatMethodology {
	return CHAT_METHODOLOGIES.some((methodology) => methodology.id === value);
}
