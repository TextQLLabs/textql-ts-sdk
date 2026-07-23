# TextqlRpcPublicAppListAppVersionsResponse

AppFile is one non-entry file of a multi-file app tree; code remains the entry index.html.

## Example Usage

```typescript
import { TextqlRpcPublicAppListAppVersionsResponse } from "@textql/sdk/models";

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
| `versions`                                                                              | [models.TextqlRpcPublicAppAppVersion](../models/textql-rpc-public-app-app-version.md)[] | :heavy_minus_sign:                                                                      | normalized relative path, forward slashes, no .. or leading /                           |
| `totalCount`                                                                            | *number*                                                                                | :heavy_minus_sign:                                                                      | N/A                                                                                     |