# ChatServiceSendMessageRequest

## Example Usage

```typescript
import { ChatServiceSendMessageRequest } from "textql-sdk/models/operations";

let value: ChatServiceSendMessageRequest = {
  body: {},
};
```

## Fields

| Field                                                                                        | Type                                                                                         | Required                                                                                     | Description                                                                                  |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                     | *1*                                                                                          | :heavy_check_mark:                                                                           | N/A                                                                                          |
| `connectTimeoutMs`                                                                           | *number*                                                                                     | :heavy_minus_sign:                                                                           | N/A                                                                                          |
| `body`                                                                                       | [models.TextqlRpcPublicChatSendRequest](../../models/textql-rpc-public-chat-send-request.md) | :heavy_check_mark:                                                                           | N/A                                                                                          |