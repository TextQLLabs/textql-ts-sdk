# TextqlRpcPublicRbacGetMemberRolesResponse

## Example Usage

```typescript
import { TextqlRpcPublicRbacGetMemberRolesResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacGetMemberRolesResponse = {
  memberRoles: {
    "key": {
      roles: [
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

| Field                                                                                                     | Type                                                                                                      | Required                                                                                                  | Description                                                                                               |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `memberRoles`                                                                                             | Record<string, [models.TextqlRpcPublicRbacMemberRoles](../models/textql-rpc-public-rbac-member-roles.md)> | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |