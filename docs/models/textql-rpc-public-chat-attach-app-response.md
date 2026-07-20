# TextqlRpcPublicChatAttachAppResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatAttachAppResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicChatAttachAppResponse = {
  cell: {
    gmailEmailSearchCell: {},
    timestamp: new Date("2023-01-15T01:30:15.01Z"),
  },
  app: {
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    refreshedAt: new Date("2023-01-15T01:30:15.01Z"),
    publishedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                  | Type                                                                   | Required                                                               | Description                                                            |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `cell`                                                                 | *models.TextqlRpcPublicChatCell*                                       | :heavy_minus_sign:                                                     | N/A                                                                    |
| `app`                                                                  | [models.TextqlRpcPublicAppApp](../models/textql-rpc-public-app-app.md) | :heavy_minus_sign:                                                     | N/A                                                                    |