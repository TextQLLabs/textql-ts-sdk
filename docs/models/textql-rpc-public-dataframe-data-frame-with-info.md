# TextqlRpcPublicDataframeDataFrameWithInfo

## Example Usage

```typescript
import { TextqlRpcPublicDataframeDataFrameWithInfo } from "@textql/sdk/models";

let value: TextqlRpcPublicDataframeDataFrameWithInfo = {
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

| Field                                                                                                    | Type                                                                                                     | Required                                                                                                 | Description                                                                                              |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `df`                                                                                                     | [models.TextqlRpcPublicDataframeDataFrame](../models/textql-rpc-public-dataframe-data-frame.md)          | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |
| `info`                                                                                                   | [models.TextqlRpcPublicDataframeDataFrameInfo](../models/textql-rpc-public-dataframe-data-frame-info.md) | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |
| `preview`                                                                                                | *boolean*                                                                                                | :heavy_minus_sign:                                                                                       | whether df is merely a preview                                                                           |