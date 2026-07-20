# TextqlRpcPublicChatUpdateChatRequest

## Example Usage

```typescript
import { TextqlRpcPublicChatUpdateChatRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicChatUpdateChatRequest = {};
```

## Fields

| Field                                                                                    | Type                                                                                     | Required                                                                                 | Description                                                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `chatId`                                                                                 | *string*                                                                                 | :heavy_minus_sign:                                                                       | N/A                                                                                      |
| `research`                                                                               | *boolean*                                                                                | :heavy_minus_sign:                                                                       | update report mode                                                                       |
| `summary`                                                                                | *string*                                                                                 | :heavy_minus_sign:                                                                       | update chat summary                                                                      |
| `dashboardMode`                                                                          | *boolean*                                                                                | :heavy_minus_sign:                                                                       | update dashboard mode                                                                    |
| `methodology`                                                                            | [models.TextqlRpcPublicChatMethodology](../models/textql-rpc-public-chat-methodology.md) | :heavy_minus_sign:                                                                       | N/A                                                                                      |
| `fastMode`                                                                               | *boolean*                                                                                | :heavy_minus_sign:                                                                       | update fast inference mode                                                               |