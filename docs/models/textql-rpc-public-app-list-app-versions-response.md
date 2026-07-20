# TextqlRpcPublicAppListAppVersionsResponse

Version history (mirrors dashboard.DashboardVersion). A snapshot of the
 published app at publish time; restore writes it back into the draft.

## Example Usage

```typescript
import { TextqlRpcPublicAppListAppVersionsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicAppListAppVersionsResponse = {
  versions: [
    {
      publishedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                   | Type                                                                                    | Required                                                                                | Description                                                                             |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `versions`                                                                              | [models.TextqlRpcPublicAppAppVersion](../models/textql-rpc-public-app-app-version.md)[] | :heavy_minus_sign:                                                                      | N/A                                                                                     |
| `totalCount`                                                                            | *number*                                                                                | :heavy_minus_sign:                                                                      | N/A                                                                                     |