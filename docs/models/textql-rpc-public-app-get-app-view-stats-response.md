# TextqlRpcPublicAppGetAppViewStatsResponse

View analytics

## Example Usage

```typescript
import { TextqlRpcPublicAppGetAppViewStatsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicAppGetAppViewStatsResponse = {
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

| Field                                                                                          | Type                                                                                           | Required                                                                                       | Description                                                                                    |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `totalViews`                                                                                   | *number*                                                                                       | :heavy_minus_sign:                                                                             | N/A                                                                                            |
| `uniqueViewers`                                                                                | *number*                                                                                       | :heavy_minus_sign:                                                                             | N/A                                                                                            |
| `recentViewers`                                                                                | [models.TextqlRpcPublicAppAppViewerInfo](../models/textql-rpc-public-app-app-viewer-info.md)[] | :heavy_minus_sign:                                                                             | N/A                                                                                            |