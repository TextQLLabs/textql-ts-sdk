# TextqlRpcPublicPowerbiSyncPowerBIItemsRequest

## Example Usage

```typescript
import { TextqlRpcPublicPowerbiSyncPowerBIItemsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicPowerbiSyncPowerBIItemsRequest = {
  reports: [
    {
      createdDate: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
  datasets: [
    {
      createdDate: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                    | Type                                                                                                     | Required                                                                                                 | Description                                                                                              |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `connectorId`                                                                                            | *number*                                                                                                 | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |
| `workspaceId`                                                                                            | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |
| `workspaceName`                                                                                          | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |
| `reports`                                                                                                | [models.TextqlRpcPublicPowerbiPowerBIReport](../models/textql-rpc-public-powerbi-power-bi-report.md)[]   | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |
| `datasets`                                                                                               | [models.TextqlRpcPublicPowerbiPowerBIDataset](../models/textql-rpc-public-powerbi-power-bi-dataset.md)[] | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |