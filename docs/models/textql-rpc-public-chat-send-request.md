# TextqlRpcPublicChatSendRequest

## Example Usage

```typescript
import { TextqlRpcPublicChatSendRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicChatSendRequest = {
  chatId: "<id>",
  message: "<value>",
};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `chatId`           | *string*           | :heavy_check_mark: | N/A                |
| `message`          | *string*           | :heavy_check_mark: | N/A                |
| `imageUrls`        | *string*[]         | :heavy_minus_sign: | N/A                |
| `messageId`        | *string*           | :heavy_minus_sign: | N/A                |
| `steering`         | *boolean*          | :heavy_minus_sign: | N/A                |