# TextqlRpcPublicDashboardGetDashboardViewStatsResponse

## Example Usage

```typescript
import { TextqlRpcPublicDashboardGetDashboardViewStatsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicDashboardGetDashboardViewStatsResponse = {
  recentViewers: [
    {
      lastViewed: new Date("2023-01-15T01:30:15.01Z"),
      recentViewTimes: [
        new Date("2023-01-15T01:30:15.01Z"),
        new Date("2024-12-25T12:00:00Z"),
      ],
    },
  ],
};
```

## Fields

| Field                                                                                                                  | Type                                                                                                                   | Required                                                                                                               | Description                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `totalViews`                                                                                                           | *number*                                                                                                               | :heavy_minus_sign:                                                                                                     | N/A                                                                                                                    |
| `uniqueViewers`                                                                                                        | *number*                                                                                                               | :heavy_minus_sign:                                                                                                     | N/A                                                                                                                    |
| `recentViewers`                                                                                                        | [models.TextqlRpcPublicDashboardDashboardViewerInfo](../models/textql-rpc-public-dashboard-dashboard-viewer-info.md)[] | :heavy_minus_sign:                                                                                                     | N/A                                                                                                                    |