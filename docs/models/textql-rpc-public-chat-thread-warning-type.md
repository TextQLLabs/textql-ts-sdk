# TextqlRpcPublicChatThreadWarningType

ThreadWarningType is the canonical set of thread warning types

## Example Usage

```typescript
import { TextqlRpcPublicChatThreadWarningType } from "textql-sdk/models";

let value: TextqlRpcPublicChatThreadWarningType =
  "THREAD_WARNING_TYPE_ERROR_LOOP";

// Open enum: unrecognized values are captured as Unrecognized<string>
```

## Values

```typescript
"THREAD_WARNING_TYPE_UNSPECIFIED" | "THREAD_WARNING_TYPE_MISSING_CONTEXT" | "THREAD_WARNING_TYPE_ERROR_LOOP" | "THREAD_WARNING_TYPE_EXCESSIVE_TOOL_CALLS" | "THREAD_WARNING_TYPE_SLOW_QUERY" | "THREAD_WARNING_TYPE_NO_RESULTS" | "THREAD_WARNING_TYPE_USER_FRUSTRATION" | "THREAD_WARNING_TYPE_POTENTIAL_HALLUCINATION" | "THREAD_WARNING_TYPE_IGNORED_INSTRUCTION" | "THREAD_WARNING_TYPE_USER_THUMBS_DOWN" | "THREAD_WARNING_TYPE_NO_CONCLUSION" | Unrecognized<string>
```