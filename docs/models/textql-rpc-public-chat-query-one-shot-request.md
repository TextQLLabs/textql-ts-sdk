# TextqlRpcPublicChatQueryOneShotRequest

Simplified query request for external API users

## Example Usage

```typescript
import { TextqlRpcPublicChatQueryOneShotRequest } from "textql-sdk/models";

let value: TextqlRpcPublicChatQueryOneShotRequest = {};
```

## Fields

| Field                                                                                      | Type                                                                                       | Required                                                                                   | Description                                                                                |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| `question`                                                                                 | *string*                                                                                   | :heavy_minus_sign:                                                                         | N/A                                                                                        |
| `paradigm`                                                                                 | [models.TextqlRpcPublicParadigmParadigm](../models/textql-rpc-public-paradigm-paradigm.md) | :heavy_minus_sign:                                                                         | ChatParadigm includes paradigm options                                                     |
| `model`                                                                                    | [models.TextqlRpcPublicChatLlmModel](../models/textql-rpc-public-chat-llm-model.md)        | :heavy_minus_sign:                                                                         | N/A                                                                                        |
| `chatId`                                                                                   | *string*                                                                                   | :heavy_minus_sign:                                                                         | N/A                                                                                        |