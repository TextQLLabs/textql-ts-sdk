# TextqlRpcPublicRbacAssignPermissionToRoleRequest

## Example Usage

```typescript
import { TextqlRpcPublicRbacAssignPermissionToRoleRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacAssignPermissionToRoleRequest = {};
```

## Fields

| Field                                                                                                   | Type                                                                                                    | Required                                                                                                | Description                                                                                             |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `roleName`                                                                                              | *string*                                                                                                | :heavy_minus_sign:                                                                                      | Exact, case-sensitive role name, unique within the caller's organization.<br/> Supply role_name or role_id. |
| `permission`                                                                                            | *models.TextqlRpcPublicRbacPermissionSpec*                                                              | :heavy_minus_sign:                                                                                      | A single RBAC permission. Select a resource and one of its supported actions.                           |
| `roleId`                                                                                                | *string*                                                                                                | :heavy_minus_sign:                                                                                      | Existing role ID. Prefer role_name; if both are supplied they must match.                               |