# ChatServiceGetChatHistoryRequest

## Example Usage

```typescript
import { ChatServiceGetChatHistoryRequest } from "textql-sdk/models/operations";

let value: ChatServiceGetChatHistoryRequest = {
  connectProtocolVersion: 1,
  body: {},
};
```

## Fields

| Field                                                                                              | Type                                                                                               | Required                                                                                           | Description                                                                                        |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                           | *1*                                                                                                | :heavy_check_mark:                                                                                 | N/A                                                                                                |
| `connectTimeoutMs`                                                                                 | *number*                                                                                           | :heavy_minus_sign:                                                                                 | N/A                                                                                                |
| `body`                                                                                             | [models.TextqlRpcPublicChatHistoryRequest](../../models/textql-rpc-public-chat-history-request.md) | :heavy_check_mark:                                                                                 | N/A                                                                                                |