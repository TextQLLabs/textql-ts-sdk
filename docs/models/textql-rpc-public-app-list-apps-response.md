# TextqlRpcPublicAppListAppsResponse

## Example Usage

```typescript
import { TextqlRpcPublicAppListAppsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicAppListAppsResponse = {
  apps: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      refreshedAt: new Date("2023-01-15T01:30:15.01Z"),
      publishedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                    | Type                                                                     | Required                                                                 | Description                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `apps`                                                                   | [models.TextqlRpcPublicAppApp](../models/textql-rpc-public-app-app.md)[] | :heavy_minus_sign:                                                       | N/A                                                                      |
| `totalCount`                                                             | *number*                                                                 | :heavy_minus_sign:                                                       | whether the caller may edit this app (HasAppWriteAccess)                 |