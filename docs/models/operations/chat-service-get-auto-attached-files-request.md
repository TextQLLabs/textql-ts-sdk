# ChatServiceGetAutoAttachedFilesRequest

## Example Usage

```typescript
import { ChatServiceGetAutoAttachedFilesRequest } from "@textql/sdk/models/operations";

let value: ChatServiceGetAutoAttachedFilesRequest = {
  body: {
    chatId: "<id>",
  },
};
```

## Fields

| Field                                                                                                                           | Type                                                                                                                            | Required                                                                                                                        | Description                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                        | *1*                                                                                                                             | :heavy_check_mark:                                                                                                              | N/A                                                                                                                             |
| `connectTimeoutMs`                                                                                                              | *number*                                                                                                                        | :heavy_minus_sign:                                                                                                              | N/A                                                                                                                             |
| `body`                                                                                                                          | [models.TextqlRpcPublicChatGetAutoAttachedFilesRequest](../../models/textql-rpc-public-chat-get-auto-attached-files-request.md) | :heavy_check_mark:                                                                                                              | N/A                                                                                                                             |