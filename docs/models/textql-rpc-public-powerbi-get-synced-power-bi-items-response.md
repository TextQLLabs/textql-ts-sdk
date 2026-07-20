# TextqlRpcPublicPowerbiGetSyncedPowerBIItemsResponse

## Example Usage

```typescript
import { TextqlRpcPublicPowerbiGetSyncedPowerBIItemsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicPowerbiGetSyncedPowerBIItemsResponse = {
  reports: [
    {
      report: {
        createdDate: new Date("2023-01-15T01:30:15.01Z"),
      },
      syncedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
  datasets: [
    {
      dataset: {
        createdDate: new Date("2023-01-15T01:30:15.01Z"),
      },
      syncedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                 | Type                                                                                                                  | Required                                                                                                              | Description                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `reports`                                                                                                             | [models.TextqlRpcPublicPowerbiSyncedPowerBIReport](../models/textql-rpc-public-powerbi-synced-power-bi-report.md)[]   | :heavy_minus_sign:                                                                                                    | N/A                                                                                                                   |
| `datasets`                                                                                                            | [models.TextqlRpcPublicPowerbiSyncedPowerBIDataset](../models/textql-rpc-public-powerbi-synced-power-bi-dataset.md)[] | :heavy_minus_sign:                                                                                                    | N/A                                                                                                                   |