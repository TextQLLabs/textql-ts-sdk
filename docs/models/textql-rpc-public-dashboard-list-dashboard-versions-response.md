# TextqlRpcPublicDashboardListDashboardVersionsResponse

## Example Usage

```typescript
import { TextqlRpcPublicDashboardListDashboardVersionsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicDashboardListDashboardVersionsResponse = {
  versions: [
    {
      publishedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                           | Type                                                                                                            | Required                                                                                                        | Description                                                                                                     |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `versions`                                                                                                      | [models.TextqlRpcPublicDashboardDashboardVersion](../models/textql-rpc-public-dashboard-dashboard-version.md)[] | :heavy_minus_sign:                                                                                              | N/A                                                                                                             |
| `totalCount`                                                                                                    | *number*                                                                                                        | :heavy_minus_sign:                                                                                              | N/A                                                                                                             |