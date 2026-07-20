# DatasetServiceCreateTableauDatasetRequest

## Example Usage

```typescript
import { DatasetServiceCreateTableauDatasetRequest } from "textql-sdk/models/operations";

let value: DatasetServiceCreateTableauDatasetRequest = {
  body: {
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
};
```

## Fields

| Field                                                                                                                                | Type                                                                                                                                 | Required                                                                                                                             | Description                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `connectProtocolVersion`                                                                                                             | *1*                                                                                                                                  | :heavy_check_mark:                                                                                                                   | N/A                                                                                                                                  |
| `connectTimeoutMs`                                                                                                                   | *number*                                                                                                                             | :heavy_minus_sign:                                                                                                                   | N/A                                                                                                                                  |
| `body`                                                                                                                               | [models.TextqlRpcPublicDatasetCreateTableauDatasetRequest](../../models/textql-rpc-public-dataset-create-tableau-dataset-request.md) | :heavy_check_mark:                                                                                                                   | N/A                                                                                                                                  |