# TextqlRpcPublicObserveThreadWarning

## Example Usage

```typescript
import { TextqlRpcPublicObserveThreadWarning } from "textql-sdk/models";

let value: TextqlRpcPublicObserveThreadWarning = {
  fixPatchCell: {
    connectorsCell: {},
    timestamp: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                  | Type                                                                                                   | Required                                                                                               | Description                                                                                            |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `id`                                                                                                   | *string*                                                                                               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `chatId`                                                                                               | *string*                                                                                               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `warningType`                                                                                          | [models.TextqlRpcPublicChatThreadWarningType](../models/textql-rpc-public-chat-thread-warning-type.md) | :heavy_minus_sign:                                                                                     | ThreadWarningType is the canonical set of thread warning types                                         |
| `severity`                                                                                             | *string*                                                                                               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `detail`                                                                                               | *string*                                                                                               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `fixChatId`                                                                                            | *string*                                                                                               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `fixPatchCell`                                                                                         | *models.TextqlRpcPublicChatCell*                                                                       | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `fixRunActive`                                                                                         | *boolean*                                                                                              | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `fixStatus`                                                                                            | *string*                                                                                               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |