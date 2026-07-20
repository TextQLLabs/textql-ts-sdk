# TextqlRpcPublicDashboardCheckDashboardHealthResponse

## Example Usage

```typescript
import { TextqlRpcPublicDashboardCheckDashboardHealthResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicDashboardCheckDashboardHealthResponse = {
  dashboards: [
    {
      refreshedAt: new Date("2023-01-15T01:30:15.01Z"),
      publishedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                                                                     | Type                                                                                                                                                                      | Required                                                                                                                                                                  | Description                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dashboards`                                                                                                                                                              | [models.TextqlRpcPublicDashboardCheckDashboardHealthResponseDashboardHealth](../models/textql-rpc-public-dashboard-check-dashboard-health-response-dashboard-health.md)[] | :heavy_minus_sign:                                                                                                                                                        | N/A                                                                                                                                                                       |