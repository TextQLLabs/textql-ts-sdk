# RBACServiceShareObjectWithGroupRequest

## Example Usage

```typescript
import { RBACServiceShareObjectWithGroupRequest } from "@textql/sdk/models/operations";

let value: RBACServiceShareObjectWithGroupRequest = {
  body: {
    expiresAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                                           | Type                                                                                                                            | Required                                                                                                                        | Description                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                        | *1*                                                                                                                             | :heavy_check_mark:                                                                                                              | N/A                                                                                                                             |
| `connectTimeoutMs`                                                                                                              | *number*                                                                                                                        | :heavy_minus_sign:                                                                                                              | N/A                                                                                                                             |
| `body`                                                                                                                          | [models.TextqlRpcPublicRbacShareObjectWithGroupRequest](../../models/textql-rpc-public-rbac-share-object-with-group-request.md) | :heavy_check_mark:                                                                                                              | N/A                                                                                                                             |