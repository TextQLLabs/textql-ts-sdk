# TextqlRpcPublicCellsCitationLineageNode

## Example Usage

```typescript
import { TextqlRpcPublicCellsCitationLineageNode } from "textql-sdk/models";

let value: TextqlRpcPublicCellsCitationLineageNode = {};
```

## Fields

| Field                                                     | Type                                                      | Required                                                  | Description                                               |
| --------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `cellId`                                                  | *string*                                                  | :heavy_minus_sign:                                        | N/A                                                       |
| `kind`                                                    | *string*                                                  | :heavy_minus_sign:                                        | "sql" \| "python"                                         |
| `dataframeName`                                           | *string*                                                  | :heavy_minus_sign:                                        | Produced dataframe name, if applicable                    |
| `connectorId`                                             | *number*                                                  | :heavy_minus_sign:                                        | SQL only: connector ID; display name resolves client-side |
| `tables`                                                  | *string*[]                                                | :heavy_minus_sign:                                        | SQL only: referenced tables                               |
| `inputCellIds`                                            | *string*[]                                                | :heavy_minus_sign:                                        | upstream cell(s), for graph lineage                       |