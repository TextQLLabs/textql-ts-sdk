/**
 * Cell lifecycle values as they arrive on the wire.
 *
 * The Python backend passes the `WatchChatEvent` straight through as protobuf
 * JSON, so an enum is its proto name — the same strings the generated SDKs use.
 * Declared here rather than imported so this demo needs no TypeScript SDK.
 */
export const CellLifecycle = {
	LifecycleUnknown: 'LIFECYCLE_UNKNOWN',
	LifecycleCreating: 'LIFECYCLE_CREATING',
	LifecycleCreated: 'LIFECYCLE_CREATED',
	LifecycleExecuting: 'LIFECYCLE_EXECUTING',
	LifecycleExecuted: 'LIFECYCLE_EXECUTED',
	LifecycleHalted: 'LIFECYCLE_HALTED',
	LifecycleHandoffPending: 'LIFECYCLE_HANDOFF_PENDING'
} as const;

/** Open enum: a deployment can send a lifecycle this build has never heard of. */
export type CellLifecycle = (typeof CellLifecycle)[keyof typeof CellLifecycle] | (string & {});

/** Questions-cell enums, same wire form as the lifecycle above. */
export const QuestionKind = {
	Unknown: 'QUESTION_KIND_UNKNOWN',
	Choice: 'QUESTION_KIND_CHOICE',
	Multichoice: 'QUESTION_KIND_MULTICHOICE',
	Inputs: 'QUESTION_KIND_INPUTS'
} as const;

export const QuestionInputKind = {
	Unknown: 'QUESTION_INPUT_KIND_UNKNOWN',
	Text: 'QUESTION_INPUT_KIND_TEXT',
	Formfield: 'QUESTION_INPUT_KIND_FORMFIELD',
	Multiline: 'QUESTION_INPUT_KIND_MULTILINE'
} as const;

export const QuestionsStatus = {
	Unknown: 'QUESTIONS_STATUS_UNKNOWN',
	Pending: 'QUESTIONS_STATUS_PENDING',
	Answered: 'QUESTIONS_STATUS_ANSWERED',
	Dismissed: 'QUESTIONS_STATUS_DISMISSED'
} as const;
