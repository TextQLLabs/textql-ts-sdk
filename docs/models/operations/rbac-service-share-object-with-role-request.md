# RBACServiceShareObjectWithRoleRequest

## Example Usage

```typescript
import { RBACServiceShareObjectWithRoleRequest } from "@textql/sdk/models/operations";

let value: RBACServiceShareObjectWithRoleRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                         | Type                                                                                                                          | Required                                                                                                                      | Description                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                      | *"1"*                                                                                                                         | :heavy_check_mark:                                                                                                            | Define the version of the Connect protocol                                                                                    |
| `connectTimeoutMs`                                                                                                            | *number*                                                                                                                      | :heavy_minus_sign:                                                                                                            | N/A                                                                                                                           |
| `body`                                                                                                                        | [models.TextqlRpcPublicRbacShareObjectWithRoleRequest](../../models/textql-rpc-public-rbac-share-object-with-role-request.md) | :heavy_check_mark:                                                                                                            | N/A                                                                                                                           |