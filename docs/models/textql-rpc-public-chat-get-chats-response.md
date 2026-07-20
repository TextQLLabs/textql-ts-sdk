# TextqlRpcPublicChatGetChatsResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatGetChatsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicChatGetChatsResponse = {
  chats: [
    {
      timestamp: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                        | Type                                                                         | Required                                                                     | Description                                                                  |
| ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `chats`                                                                      | [models.TextqlRpcPublicChatChat](../models/textql-rpc-public-chat-chat.md)[] | :heavy_minus_sign:                                                           | N/A                                                                          |
| `totalCount`                                                                 | *number*                                                                     | :heavy_minus_sign:                                                           | N/A                                                                          |