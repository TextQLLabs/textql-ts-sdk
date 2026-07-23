# TextqlRpcPublicCellsAppCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsAppCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsAppCell = {};
```

## Fields

| Field                                                     | Type                                                      | Required                                                  | Description                                               |
| --------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `action`                                                  | *string*                                                  | :heavy_minus_sign:                                        | N/A                                                       |
| `appId`                                                   | *string*                                                  | :heavy_minus_sign:                                        | "sql" \| "python"                                         |
| `name`                                                    | *string*                                                  | :heavy_minus_sign:                                        | Produced dataframe name, if applicable                    |
| `errorMessage`                                            | *string*                                                  | :heavy_minus_sign:                                        | SQL only: connector ID; display name resolves client-side |
| `screenshotUrl`                                           | *string*                                                  | :heavy_minus_sign:                                        | SQL only: referenced tables                               |
| `lastRunAt`                                               | *string*                                                  | :heavy_minus_sign:                                        | upstream cell(s), for graph lineage                       |
| `buildLineCount`                                          | *number*                                                  | :heavy_minus_sign:                                        | N/A                                                       |
| `buildFileCount`                                          | *number*                                                  | :heavy_minus_sign:                                        | N/A                                                       |