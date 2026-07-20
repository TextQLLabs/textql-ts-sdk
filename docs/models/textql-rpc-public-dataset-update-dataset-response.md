# TextqlRpcPublicDatasetUpdateDatasetResponse

## Example Usage

```typescript
import { TextqlRpcPublicDatasetUpdateDatasetResponse } from "textql-sdk/models";

let value: TextqlRpcPublicDatasetUpdateDatasetResponse = {
  dataset: {
    tableauData: {
      views: [
        {
          createdAt: new Date("2023-01-15T01:30:15.01Z"),
          updatedAt: new Date("2023-01-15T01:30:15.01Z"),
        },
      ],
      datasources: [
        {
          createdAt: new Date("2023-01-15T01:30:15.01Z"),
          updatedAt: new Date("2023-01-15T01:30:15.01Z"),
        },
      ],
    },
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    expiresAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                  | Type                                   | Required                               | Description                            |
| -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- |
| `dataset`                              | *models.TextqlRpcPublicDatasetDataset* | :heavy_minus_sign:                     | N/A                                    |