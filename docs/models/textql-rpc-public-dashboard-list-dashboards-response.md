# TextqlRpcPublicDashboardListDashboardsResponse

## Example Usage

```typescript
import { TextqlRpcPublicDashboardListDashboardsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicDashboardListDashboardsResponse = {
  dashboards: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      refreshedAt: new Date("2023-01-15T01:30:15.01Z"),
      publishedAt: new Date("2023-01-15T01:30:15.01Z"),
      latestScheduledRunAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                            | Type                                                                                             | Required                                                                                         | Description                                                                                      |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `dashboards`                                                                                     | [models.TextqlRpcPublicDashboardDashboard](../models/textql-rpc-public-dashboard-dashboard.md)[] | :heavy_minus_sign:                                                                               | N/A                                                                                              |
| `totalCount`                                                                                     | *number*                                                                                         | :heavy_minus_sign:                                                                               | N/A                                                                                              |