# Timestamps

## Example Usage

```typescript
import { Timestamps } from "@textql/sdk/models";

let value: Timestamps = {
  timestamps: {
    values: [
      new Date("2023-01-15T01:30:15.01Z"),
      new Date("2024-12-25T12:00:00Z"),
    ],
  },
};
```

## Fields

| Field                                                                                                       | Type                                                                                                        | Required                                                                                                    | Description                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `timestamps`                                                                                                | [models.TextqlRpcPublicDataframeTimestampValues](../models/textql-rpc-public-dataframe-timestamp-values.md) | :heavy_check_mark:                                                                                          | N/A                                                                                                         |
| `columnIndex`                                                                                               | *number*                                                                                                    | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |