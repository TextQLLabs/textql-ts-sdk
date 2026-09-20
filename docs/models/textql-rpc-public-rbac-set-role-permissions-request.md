# TextqlRpcPublicRbacSetRolePermissionsRequest

## Example Usage

```typescript
import { TextqlRpcPublicRbacSetRolePermissionsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacSetRolePermissionsRequest = {};
```

## Fields

| Field                                                                                                           | Type                                                                                                            | Required                                                                                                        | Description                                                                                                     |
| --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `roleName`                                                                                                      | *string*                                                                                                        | :heavy_minus_sign:                                                                                              | Exact, case-sensitive role name, unique within the caller's organization.<br/> Supply role_name or role_id.     |
| `addPermissions`                                                                                                | *models.TextqlRpcPublicRbacPermissionSpec*[]                                                                    | :heavy_minus_sign:                                                                                              | Permissions to add. Duplicates are ignored; a permission cannot be both<br/> added and removed in the same request. |
| `removePermissions`                                                                                             | *models.TextqlRpcPublicRbacPermissionSpec*[]                                                                    | :heavy_minus_sign:                                                                                              | Permissions to remove.                                                                                          |
| `roleId`                                                                                                        | *string*                                                                                                        | :heavy_minus_sign:                                                                                              | Existing role ID. Prefer role_name; if both are supplied they must match.                                       |