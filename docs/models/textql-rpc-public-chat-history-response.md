# TextqlRpcPublicChatHistoryResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatHistoryResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicChatHistoryResponse = {
  cells: [
    {
      statusCell: {},
      timestamp: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                              | Type                               | Required                           | Description                        |
| ---------------------------------- | ---------------------------------- | ---------------------------------- | ---------------------------------- |
| `cells`                            | *models.TextqlRpcPublicChatCell*[] | :heavy_minus_sign:                 | N/A                                |
| `hasMore`                          | *boolean*                          | :heavy_minus_sign:                 | N/A                                |