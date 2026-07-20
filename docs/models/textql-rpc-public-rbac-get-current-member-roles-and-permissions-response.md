# TextqlRpcPublicRbacGetCurrentMemberRolesAndPermissionsResponse

## Example Usage

```typescript
import { TextqlRpcPublicRbacGetCurrentMemberRolesAndPermissionsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacGetCurrentMemberRolesAndPermissionsResponse = {
  roles: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
  permissions: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                    | Type                                                                                     | Required                                                                                 | Description                                                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `roles`                                                                                  | [models.TextqlRpcPublicRbacRole](../models/textql-rpc-public-rbac-role.md)[]             | :heavy_minus_sign:                                                                       | N/A                                                                                      |
| `permissions`                                                                            | [models.TextqlRpcPublicRbacPermission](../models/textql-rpc-public-rbac-permission.md)[] | :heavy_minus_sign:                                                                       | N/A                                                                                      |