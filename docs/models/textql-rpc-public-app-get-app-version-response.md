# TextqlRpcPublicAppGetAppVersionResponse

## Example Usage

```typescript
import { TextqlRpcPublicAppGetAppVersionResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicAppGetAppVersionResponse = {
  version: {
    publishedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                                                                                     | Type                                                                                                                                                                      | Required                                                                                                                                                                  | Description                                                                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version`                                                                                                                                                                 | [models.TextqlRpcPublicAppAppVersion](../models/textql-rpc-public-app-app-version.md)                                                                                     | :heavy_minus_sign:                                                                                                                                                        | Version history entry. Git-backed apps derive one per library commit (published_by/at<br/> carry the commit author/time); legacy rows are pre-existing publish-era snapshots. |