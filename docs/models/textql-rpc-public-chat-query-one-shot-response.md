# TextqlRpcPublicChatQueryOneShotResponse

Simplified query response for external API users

## Example Usage

```typescript
import { TextqlRpcPublicChatQueryOneShotResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicChatQueryOneShotResponse = {
  cells: [
    {
      dashboardCell: {
        updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      },
      timestamp: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                              | Type                               | Required                           | Description                        |
| ---------------------------------- | ---------------------------------- | ---------------------------------- | ---------------------------------- |
| `chatId`                           | *string*                           | :heavy_minus_sign:                 | N/A                                |
| `answer`                           | *string*                           | :heavy_minus_sign:                 | N/A                                |
| `cells`                            | *models.TextqlRpcPublicChatCell*[] | :heavy_minus_sign:                 | N/A                                |