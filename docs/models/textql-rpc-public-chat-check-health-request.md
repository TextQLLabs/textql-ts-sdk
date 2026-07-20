# TextqlRpcPublicChatCheckHealthRequest

## Example Usage

```typescript
import { TextqlRpcPublicChatCheckHealthRequest } from "textql-sdk/models";

let value: TextqlRpcPublicChatCheckHealthRequest = {};
```

## Fields

| Field                                                                               | Type                                                                                | Required                                                                            | Description                                                                         |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `model`                                                                             | [models.TextqlRpcPublicChatLlmModel](../models/textql-rpc-public-chat-llm-model.md) | :heavy_minus_sign:                                                                  | N/A                                                                                 |
| `functional`                                                                        | *boolean*                                                                           | :heavy_minus_sign:                                                                  | if true, runs actual execution tests (expensive)                                    |