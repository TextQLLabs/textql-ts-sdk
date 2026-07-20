# TextqlRpcPublicChatGetCompletionParametersBatchResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatGetCompletionParametersBatchResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicChatGetCompletionParametersBatchResponse = {
  paramsByCellId: {
    "key": {
      startedAt: new Date("2023-01-15T01:30:15.01Z"),
      completedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  },
};
```

## Fields

| Field                                                                                                                              | Type                                                                                                                               | Required                                                                                                                           | Description                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `paramsByCellId`                                                                                                                   | Record<string, [models.TextqlRpcPublicChatLlmCompletionParameters](../models/textql-rpc-public-chat-llm-completion-parameters.md)> | :heavy_minus_sign:                                                                                                                 | N/A                                                                                                                                |