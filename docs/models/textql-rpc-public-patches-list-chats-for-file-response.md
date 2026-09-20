# TextqlRpcPublicPatchesListChatsForFileResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesListChatsForFileResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesListChatsForFileResponse = {
  chats: [
    {
      lastPulled: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                  | Type                                                                                                   | Required                                                                                               | Description                                                                                            |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `chats`                                                                                                | [models.TextqlRpcPublicPatchesFileChatUsage](../models/textql-rpc-public-patches-file-chat-usage.md)[] | :heavy_minus_sign:                                                                                     | most recent pull first                                                                                 |