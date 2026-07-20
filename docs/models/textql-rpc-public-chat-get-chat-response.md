# TextqlRpcPublicChatGetChatResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatGetChatResponse } from "textql-sdk/models";

let value: TextqlRpcPublicChatGetChatResponse = {
  chat: {
    timestamp: new Date("2023-01-15T01:30:15.01Z"),
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
  messages: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                         | Type                                                                                          | Required                                                                                      | Description                                                                                   |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `chat`                                                                                        | [models.TextqlRpcPublicChatChat](../models/textql-rpc-public-chat-chat.md)                    | :heavy_minus_sign:                                                                            | N/A                                                                                           |
| `messages`                                                                                    | [models.TextqlRpcPublicChatChatMessage](../models/textql-rpc-public-chat-chat-message.md)[]   | :heavy_minus_sign:                                                                            | N/A                                                                                           |
| `assets`                                                                                      | [models.TextqlRpcPublicCellsPreviewCell](../models/textql-rpc-public-cells-preview-cell.md)[] | :heavy_minus_sign:                                                                            | N/A                                                                                           |