# TextqlRpcPublicCellsListDashboardsCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsListDashboardsCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsListDashboardsCell = {
  dashboards: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      refreshedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                             | Type                                                                                              | Required                                                                                          | Description                                                                                       |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `searchTerm`                                                                                      | *string*                                                                                          | :heavy_minus_sign:                                                                                | N/A                                                                                               |
| `dashboardId`                                                                                     | *string*                                                                                          | :heavy_minus_sign:                                                                                | Set for single-dashboard lookup                                                                   |
| `totalCount`                                                                                      | *number*                                                                                          | :heavy_minus_sign:                                                                                | N/A                                                                                               |
| `sandboxAvailable`                                                                                | *boolean*                                                                                         | :heavy_minus_sign:                                                                                | N/A                                                                                               |
| `errorMessage`                                                                                    | *string*                                                                                          | :heavy_minus_sign:                                                                                | N/A                                                                                               |
| `dashboards`                                                                                      | [models.TextqlRpcPublicCellsDashboardInfo](../models/textql-rpc-public-cells-dashboard-info.md)[] | :heavy_minus_sign:                                                                                | N/A                                                                                               |