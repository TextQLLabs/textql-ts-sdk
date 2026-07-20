# TextqlRpcPublicCellsSQLCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsSQLCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsSQLCell = {
  dataframe: {
    df: {
      records: [
        {
          columns: [
            {
              doubles: {},
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
| `query`                                                                                                           | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `connectorId`                                                                                                     | *number*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `dataframe`                                                                                                       | [models.TextqlRpcPublicDataframeDataFrameWithInfo](../models/textql-rpc-public-dataframe-data-frame-with-info.md) | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `dataframePreview`                                                                                                | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authRequired`                                                                                                    | *boolean*                                                                                                         | :heavy_minus_sign:                                                                                                | Per-member auth hold fields                                                                                       |
| `authConnectorName`                                                                                               | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authLocator`                                                                                                     | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authClientId`                                                                                                    | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authRole`                                                                                                        | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authCompleted`                                                                                                   | *boolean*                                                                                                         | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authConnectorType`                                                                                               | [models.TextqlRpcPublicConnectorConnectorType](../models/textql-rpc-public-connector-connector-type.md)           | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authWorkspaceUrl`                                                                                                | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | Databricks workspace URL for OAuth                                                                                |
| `executionTimeMs`                                                                                                 | *models.TextqlRpcPublicCellsSQLCellExecutionTimeMs*                                                               | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `agentMemory`                                                                                                     | *boolean*                                                                                                         | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |