# ChatServiceGetCompletionParametersRequest

## Example Usage

```typescript
import { ChatServiceGetCompletionParametersRequest } from "textql-sdk/models/operations";

let value: ChatServiceGetCompletionParametersRequest = {
  connectProtocolVersion: 1,
  body: {},
};
```

## Fields

| Field                                                                                                                                | Type                                                                                                                                 | Required                                                                                                                             | Description                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `connectProtocolVersion`                                                                                                             | *1*                                                                                                                                  | :heavy_check_mark:                                                                                                                   | N/A                                                                                                                                  |
| `connectTimeoutMs`                                                                                                                   | *number*                                                                                                                             | :heavy_minus_sign:                                                                                                                   | N/A                                                                                                                                  |
| `body`                                                                                                                               | [models.TextqlRpcPublicChatGetCompletionParametersRequest](../../models/textql-rpc-public-chat-get-completion-parameters-request.md) | :heavy_check_mark:                                                                                                                   | N/A                                                                                                                                  |