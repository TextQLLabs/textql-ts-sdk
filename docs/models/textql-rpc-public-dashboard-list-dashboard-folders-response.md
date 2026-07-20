# TextqlRpcPublicDashboardListDashboardFoldersResponse

## Example Usage

```typescript
import { TextqlRpcPublicDashboardListDashboardFoldersResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicDashboardListDashboardFoldersResponse = {
  folders: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      children: [
        {
          createdAt: new Date("2023-01-15T01:30:15.01Z"),
          updatedAt: new Date("2023-01-15T01:30:15.01Z"),
        },
      ],
    },
  ],
};
```

## Fields

| Field                                                                                                         | Type                                                                                                          | Required                                                                                                      | Description                                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `folders`                                                                                                     | [models.TextqlRpcPublicDashboardDashboardFolder](../models/textql-rpc-public-dashboard-dashboard-folder.md)[] | :heavy_minus_sign:                                                                                            | Full tree, root-level folders with children populated                                                         |