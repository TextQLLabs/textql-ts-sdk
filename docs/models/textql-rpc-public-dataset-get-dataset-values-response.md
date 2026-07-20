# TextqlRpcPublicDatasetGetDatasetValuesResponse

## Example Usage

```typescript
import { TextqlRpcPublicDatasetGetDatasetValuesResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicDatasetGetDatasetValuesResponse = {
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
};
```

## Fields

| Field                                                                                           | Type                                                                                            | Required                                                                                        | Description                                                                                     |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `df`                                                                                            | [models.TextqlRpcPublicDataframeDataFrame](../models/textql-rpc-public-dataframe-data-frame.md) | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `numCols`                                                                                       | *models.TextqlRpcPublicDatasetGetDatasetValuesResponseNumCols*                                  | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `numRows`                                                                                       | *models.TextqlRpcPublicDatasetGetDatasetValuesResponseNumRows*                                  | :heavy_minus_sign:                                                                              | N/A                                                                                             |