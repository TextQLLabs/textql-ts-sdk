export const CHAT_METHODOLOGIES = [
	{ id: 'METHODOLOGY_UNKNOWN', label: 'Server default' },
	{ id: 'METHODOLOGY_ADAPTIVE', label: 'Adaptive' },
	{ id: 'METHODOLOGY_PRESCRIPTIVE', label: 'Prescriptive' },
	{ id: 'METHODOLOGY_THOROUGH', label: 'Thorough' },
	{ id: 'METHODOLOGY_CAREFUL', label: 'Careful' },
	{ id: 'METHODOLOGY_ONTOLOGY_BUILDING', label: 'Ontology Building' }
] as const;

export type ChatMethodology = (typeof CHAT_METHODOLOGIES)[number]['id'];

export function isKnownChatMethodology(value: unknown): value is ChatMethodology {
	return CHAT_METHODOLOGIES.some((methodology) => methodology.id === value);
}
