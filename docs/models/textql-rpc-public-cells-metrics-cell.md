# TextqlRpcPublicCellsMetricsCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsMetricsCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsMetricsCell = {
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
| `dataset`                                                                                                         | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `ontologyId`                                                                                                      | *number*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `dataframe`                                                                                                       | [models.TextqlRpcPublicDataframeDataFrameWithInfo](../models/textql-rpc-public-dataframe-data-frame-with-info.md) | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `dataframePreview`                                                                                                | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `generatedSql`                                                                                                    | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `queryId`                                                                                                         | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `errorMessage`                                                                                                    | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |