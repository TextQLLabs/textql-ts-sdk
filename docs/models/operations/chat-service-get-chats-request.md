# ChatServiceGetChatsRequest

## Example Usage

```typescript
import { ChatServiceGetChatsRequest } from "textql-sdk/models/operations";

let value: ChatServiceGetChatsRequest = {
  body: {
    createdAfter: new Date("2023-01-15T01:30:15.01Z"),
    createdBefore: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                 | Type                                                                                                  | Required                                                                                              | Description                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                              | *1*                                                                                                   | :heavy_check_mark:                                                                                    | N/A                                                                                                   |
| `connectTimeoutMs`                                                                                    | *number*                                                                                              | :heavy_minus_sign:                                                                                    | N/A                                                                                                   |
| `body`                                                                                                | [models.TextqlRpcPublicChatGetChatsRequest](../../models/textql-rpc-public-chat-get-chats-request.md) | :heavy_check_mark:                                                                                    | N/A                                                                                                   |