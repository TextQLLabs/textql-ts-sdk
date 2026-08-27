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
