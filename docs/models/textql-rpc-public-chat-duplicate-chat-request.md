# TextqlRpcPublicChatDuplicateChatRequest

## Example Usage

```typescript
import { TextqlRpcPublicChatDuplicateChatRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicChatDuplicateChatRequest = {};
```

## Fields

| Field                                                                               | Type                                                                                | Required                                                                            | Description                                                                         |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `chatId`                                                                            | *string*                                                                            | :heavy_minus_sign:                                                                  | "user" or "assistant"                                                               |
| `onlyIfDifferentOwner`                                                              | *boolean*                                                                           | :heavy_minus_sign:                                                                  | N/A                                                                                 |
| `upToCellId`                                                                        | *string*                                                                            | :heavy_minus_sign:                                                                  | N/A                                                                                 |
| `paradigmOptions`                                                                   | *models.TextqlRpcPublicParadigmParadigmOptions*                                     | :heavy_minus_sign:                                                                  | N/A                                                                                 |
| `model`                                                                             | [models.TextqlRpcPublicChatLlmModel](../models/textql-rpc-public-chat-llm-model.md) | :heavy_minus_sign:                                                                  | N/A                                                                                 |
| `fastMode`                                                                          | *boolean*                                                                           | :heavy_minus_sign:                                                                  | N/A                                                                                 |