# TextqlRpcPublicCellsReportHistoryCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsReportHistoryCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsReportHistoryCell = {
  reports: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      readAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                      | Type                                                                                                       | Required                                                                                                   | Description                                                                                                |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `reports`                                                                                                  | [models.TextqlRpcPublicCellsReportHistoryInfo](../models/textql-rpc-public-cells-report-history-info.md)[] | :heavy_minus_sign:                                                                                         | N/A                                                                                                        |
| `totalCount`                                                                                               | *number*                                                                                                   | :heavy_minus_sign:                                                                                         | N/A                                                                                                        |
| `errorMessage`                                                                                             | *string*                                                                                                   | :heavy_minus_sign:                                                                                         | N/A                                                                                                        |