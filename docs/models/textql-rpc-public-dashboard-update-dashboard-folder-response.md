# TextqlRpcPublicDashboardUpdateDashboardFolderResponse

## Example Usage

```typescript
import { TextqlRpcPublicDashboardUpdateDashboardFolderResponse } from "textql-sdk/models";

let value: TextqlRpcPublicDashboardUpdateDashboardFolderResponse = {
  folder: {
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    children: [
      {
        createdAt: new Date("2023-01-15T01:30:15.01Z"),
        updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      },
    ],
  },
};
```

## Fields

| Field                                                                                                       | Type                                                                                                        | Required                                                                                                    | Description                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `folder`                                                                                                    | [models.TextqlRpcPublicDashboardDashboardFolder](../models/textql-rpc-public-dashboard-dashboard-folder.md) | :heavy_minus_sign:                                                                                          | Dashboard folder for hierarchical organization                                                              |