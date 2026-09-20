# TextqlRpcPublicRbacGetRolePermissionsRequest

## Example Usage

```typescript
import { TextqlRpcPublicRbacGetRolePermissionsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacGetRolePermissionsRequest = {};
```

## Fields

| Field                                                                                                   | Type                                                                                                    | Required                                                                                                | Description                                                                                             |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `roleName`                                                                                              | *string*                                                                                                | :heavy_minus_sign:                                                                                      | Exact, case-sensitive role name, unique within the caller's organization.<br/> Supply role_name or role_id. |
| `roleId`                                                                                                | *string*                                                                                                | :heavy_minus_sign:                                                                                      | Existing role ID. Prefer role_name; if both are supplied they must match.                               |