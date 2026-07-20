# TextqlRpcPublicChatGetCompletionParametersResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatGetCompletionParametersResponse } from "textql-sdk/models";

let value: TextqlRpcPublicChatGetCompletionParametersResponse = {
  params: {
    startedAt: new Date("2023-01-15T01:30:15.01Z"),
    completedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                              | Type                                                                                                               | Required                                                                                                           | Description                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `params`                                                                                                           | [models.TextqlRpcPublicChatLlmCompletionParameters](../models/textql-rpc-public-chat-llm-completion-parameters.md) | :heavy_minus_sign:                                                                                                 | LLM completion parameters used to create a cell                                                                    |