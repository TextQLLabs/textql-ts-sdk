# TextqlRpcPublicCellsTableauSQLCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsTableauSQLCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsTableauSQLCell = {
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
| `tableauDatasourceLuid`                                                                                           | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `query`                                                                                                           | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `dataframe`                                                                                                       | [models.TextqlRpcPublicDataframeDataFrameWithInfo](../models/textql-rpc-public-dataframe-data-frame-with-info.md) | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `dataframePreview`                                                                                                | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |