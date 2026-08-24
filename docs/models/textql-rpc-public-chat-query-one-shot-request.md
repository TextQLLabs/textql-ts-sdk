# TextqlRpcPublicChatQueryOneShotRequest

## Example Usage

```typescript
import { TextqlRpcPublicChatQueryOneShotRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicChatQueryOneShotRequest = {
  question: "<value>",
  paradigm: {},
};
```

## Fields

| Field                                                                                      | Type                                                                                       | Required                                                                                   | Description                                                                                |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `question`                                                                                 | *string*                                                                                   | :heavy_check_mark:                                                                         | N/A                                                                                        |
| `paradigm`                                                                                 | [models.TextqlRpcPublicParadigmParadigm](../models/textql-rpc-public-paradigm-paradigm.md) | :heavy_check_mark:                                                                         | ChatParadigm includes paradigm options                                                     |
| `model`                                                                                    | [models.TextqlRpcPublicChatLlmModel](../models/textql-rpc-public-chat-llm-model.md)        | :heavy_minus_sign:                                                                         | N/A                                                                                        |
| `chatId`                                                                                   | *string*                                                                                   | :heavy_minus_sign:                                                                         | N/A                                                                                        |