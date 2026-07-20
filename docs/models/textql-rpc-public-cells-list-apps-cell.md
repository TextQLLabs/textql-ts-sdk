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
| `appId`                                                                               | *string*                                                                              | :heavy_minus_sign:                                                                    | Set for single-app lookup                                                             |
| `totalCount`                                                                          | *number*                                                                              | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `errorMessage`                                                                        | *string*                                                                              | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `apps`                                                                                | [models.TextqlRpcPublicCellsAppInfo](../models/textql-rpc-public-cells-app-info.md)[] | :heavy_minus_sign:                                                                    | N/A                                                                                   |