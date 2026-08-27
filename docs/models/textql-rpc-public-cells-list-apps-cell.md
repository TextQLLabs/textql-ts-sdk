# TextqlRpcPublicCellsListAppsCell

create_design_system tool: authors/edits an org Data App design system.

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
| `searchTerm`                                                                          | *string*                                                                              | :heavy_minus_sign:                                                                    | create \| edit                                                                        |
| `appId`                                                                               | *string*                                                                              | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `totalCount`                                                                          | *number*                                                                              | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `errorMessage`                                                                        | *string*                                                                              | :heavy_minus_sign:                                                                    | in-product viewer route                                                               |
| `apps`                                                                                | [models.TextqlRpcPublicCellsAppInfo](../models/textql-rpc-public-cells-app-info.md)[] | :heavy_minus_sign:                                                                    | N/A                                                                                   |