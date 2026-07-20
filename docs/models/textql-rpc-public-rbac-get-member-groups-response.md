# TextqlRpcPublicRbacGetMemberGroupsResponse

## Example Usage

```typescript
import { TextqlRpcPublicRbacGetMemberGroupsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacGetMemberGroupsResponse = {
  memberGroups: {
    "key": {
      groups: [
        {
          createdAt: new Date("2023-01-15T01:30:15.01Z"),
          updatedAt: new Date("2023-01-15T01:30:15.01Z"),
        },
      ],
    },
  },
};
```

## Fields

| Field                                                                                                       | Type                                                                                                        | Required                                                                                                    | Description                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `memberGroups`                                                                                              | Record<string, [models.TextqlRpcPublicRbacMemberGroups](../models/textql-rpc-public-rbac-member-groups.md)> | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |