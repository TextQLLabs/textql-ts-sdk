# TextqlRpcPublicChatRateChatCellRequest

## Example Usage

```typescript
import { TextqlRpcPublicChatRateChatCellRequest } from "textql-sdk/models";

let value: TextqlRpcPublicChatRateChatCellRequest = {};
```

## Fields

| Field                                                                                   | Type                                                                                    | Required                                                                                | Description                                                                             |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `chatId`                                                                                | *string*                                                                                | :heavy_minus_sign:                                                                      | N/A                                                                                     |
| `cellId`                                                                                | *string*                                                                                | :heavy_minus_sign:                                                                      | N/A                                                                                     |
| `rating`                                                                                | [models.TextqlRpcPublicChatCellRating](../models/textql-rpc-public-chat-cell-rating.md) | :heavy_minus_sign:                                                                      | N/A                                                                                     |
| `reason`                                                                                | *string*                                                                                | :heavy_minus_sign:                                                                      | free-text "why" captured from the rating modal                                          |