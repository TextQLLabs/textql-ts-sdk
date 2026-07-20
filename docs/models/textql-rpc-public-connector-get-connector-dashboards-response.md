# TextqlRpcPublicConnectorGetConnectorDashboardsResponse

## Example Usage

```typescript
import { TextqlRpcPublicConnectorGetConnectorDashboardsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorGetConnectorDashboardsResponse = {
  dashboards: [
    {
      lastActivity: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                        | Type                                                                                                                         | Required                                                                                                                     | Description                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `stats`                                                                                                                      | [models.TextqlRpcPublicConnectorConnectorDashboardStats](../models/textql-rpc-public-connector-connector-dashboard-stats.md) | :heavy_minus_sign:                                                                                                           | N/A                                                                                                                          |
| `dashboards`                                                                                                                 | [models.TextqlRpcPublicConnectorConnectorDashboard](../models/textql-rpc-public-connector-connector-dashboard.md)[]          | :heavy_minus_sign:                                                                                                           | N/A                                                                                                                          |