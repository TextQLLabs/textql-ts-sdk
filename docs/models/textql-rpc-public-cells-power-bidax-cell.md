# TextqlRpcPublicCellsPowerBIDAXCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsPowerBIDAXCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsPowerBIDAXCell = {
  dataframe: {
    df: {
      records: [
        {
          columns: [
            {
              int32: {},
            },
          ],
        },
      ],
    },
  },
};
```

## Fields

| Field                                                                                                             | Type                                                                                                              | Required                                                                                                          | Description                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `datasetId`                                                                                                       | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `daxQuery`                                                                                                        | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `dataframe`                                                                                                       | [models.TextqlRpcPublicDataframeDataFrameWithInfo](../models/textql-rpc-public-dataframe-data-frame-with-info.md) | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `dataframePreview`                                                                                                | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authRequired`                                                                                                    | *boolean*                                                                                                         | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authConnectorName`                                                                                               | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authConnectorId`                                                                                                 | *number*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authTenantId`                                                                                                    | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authClientId`                                                                                                    | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authCompleted`                                                                                                   | *boolean*                                                                                                         | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |