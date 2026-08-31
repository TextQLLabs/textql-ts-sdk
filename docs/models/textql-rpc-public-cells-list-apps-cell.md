# TextqlRpcPublicCellsListAppsCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsListAppsCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsListAppsCell = {
  apps: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      refreshedAt: new Date("2023-01-15T01:30:15.01Z"),
      publishedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                 | Type                                                                                  | Required                                                                              | Description                                                                           |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `searchTerm`                                                                          | *string*                                                                              | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `appId`                                                                               | *string*                                                                              | :heavy_minus_sign:                                                                    | "sql" \| "python"                                                                     |
| `totalCount`                                                                          | *number*                                                                              | :heavy_minus_sign:                                                                    | Produced dataframe name, if applicable                                                |
| `errorMessage`                                                                        | *string*                                                                              | :heavy_minus_sign:                                                                    | SQL only: connector ID; display name resolves client-side                             |
| `apps`                                                                                | [models.TextqlRpcPublicCellsAppInfo](../models/textql-rpc-public-cells-app-info.md)[] | :heavy_minus_sign:                                                                    | SQL only: referenced tables                                                           |