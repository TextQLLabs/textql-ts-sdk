# ChatServiceCreateChatRequest

## Example Usage

```typescript
import { ChatServiceCreateChatRequest } from "@textql/sdk/models/operations";

let value: ChatServiceCreateChatRequest = {
  body: {},
};
```

## Fields

| Field                                                                                            | Type                                                                                             | Required                                                                                         | Description                                                                                      |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `connectProtocolVersion`                                                                         | *1*                                                                                              | :heavy_check_mark:                                                                               | N/A                                                                                              |
| `connectTimeoutMs`                                                                               | *number*                                                                                         | :heavy_minus_sign:                                                                               | N/A                                                                                              |
| `body`                                                                                           | [models.TextqlRpcPublicChatCreateRequest](../../models/textql-rpc-public-chat-create-request.md) | :heavy_check_mark:                                                                               | N/A                                                                                              |