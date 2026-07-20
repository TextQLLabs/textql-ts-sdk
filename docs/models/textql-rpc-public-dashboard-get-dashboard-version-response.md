# TextqlRpcPublicDashboardGetDashboardVersionResponse

## Example Usage

```typescript
import { TextqlRpcPublicDashboardGetDashboardVersionResponse } from "textql-sdk/models";

let value: TextqlRpcPublicDashboardGetDashboardVersionResponse = {
  version: {
    publishedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                         | Type                                                                                                          | Required                                                                                                      | Description                                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `version`                                                                                                     | [models.TextqlRpcPublicDashboardDashboardVersion](../models/textql-rpc-public-dashboard-dashboard-version.md) | :heavy_minus_sign:                                                                                            | Version history                                                                                               |