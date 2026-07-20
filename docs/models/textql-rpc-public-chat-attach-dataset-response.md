# TextqlRpcPublicChatAttachDatasetResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatAttachDatasetResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicChatAttachDatasetResponse = {
  cell: {
    gmailEmailSearchCell: {},
    timestamp: new Date("2023-01-15T01:30:15.01Z"),
  },
  dataset: {
    dataframe: {},
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    expiresAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                  | Type                                   | Required                               | Description                            |
| -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- |
| `cell`                                 | *models.TextqlRpcPublicChatCell*       | :heavy_minus_sign:                     | N/A                                    |
| `dataset`                              | *models.TextqlRpcPublicDatasetDataset* | :heavy_minus_sign:                     | N/A                                    |