# TextqlRpcPublicConnectorGetConnectorChatsResponse

## Example Usage

```typescript
import { TextqlRpcPublicConnectorGetConnectorChatsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorGetConnectorChatsResponse = {
  chats: [
    {
      lastActivity: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                              | Type                                                                                                               | Required                                                                                                           | Description                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `stats`                                                                                                            | [models.TextqlRpcPublicConnectorConnectorChatStats](../models/textql-rpc-public-connector-connector-chat-stats.md) | :heavy_minus_sign:                                                                                                 | N/A                                                                                                                |
| `chats`                                                                                                            | [models.TextqlRpcPublicConnectorConnectorChat](../models/textql-rpc-public-connector-connector-chat.md)[]          | :heavy_minus_sign:                                                                                                 | N/A                                                                                                                |