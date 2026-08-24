# TextqlRpcPublicChatRateChatCellRequest

## Example Usage

```typescript
import { TextqlRpcPublicChatRateChatCellRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicChatRateChatCellRequest = {
  chatId: "<id>",
  cellId: "<id>",
  rating: "CELL_RATING_UP",
};
```

## Fields

| Field                                                                                   | Type                                                                                    | Required                                                                                | Description                                                                             |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `chatId`                                                                                | *string*                                                                                | :heavy_check_mark:                                                                      | N/A                                                                                     |
| `cellId`                                                                                | *string*                                                                                | :heavy_check_mark:                                                                      | N/A                                                                                     |
| `rating`                                                                                | [models.TextqlRpcPublicChatCellRating](../models/textql-rpc-public-chat-cell-rating.md) | :heavy_check_mark:                                                                      | N/A                                                                                     |
| `reason`                                                                                | *string*                                                                                | :heavy_minus_sign:                                                                      | N/A                                                                                     |