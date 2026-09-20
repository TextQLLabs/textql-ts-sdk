# TextqlRpcPublicRbacImportRolePermissionsRequest

## Example Usage

```typescript
import { TextqlRpcPublicRbacImportRolePermissionsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacImportRolePermissionsRequest = {};
```

## Fields

| Field                                                                                                                                                 | Type                                                                                                                                                  | Required                                                                                                                                              | Description                                                                                                                                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                                                                                                                                                | *string*                                                                                                                                              | :heavy_minus_sign:                                                                                                                                    | Legacy CSV input. Prefer draft to approve an edited parsing response.<br/> Supply exactly one of data or draft. All values are validated before creation. |
| `draft`                                                                                                                                               | [models.TextqlRpcPublicRbacRolePermissionsImportDraft](../models/textql-rpc-public-rbac-role-permissions-import-draft.md)                             | :heavy_minus_sign:                                                                                                                                    | N/A                                                                                                                                                   |