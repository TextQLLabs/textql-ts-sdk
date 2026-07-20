# RBACServiceShareObjectRequest

## Example Usage

```typescript
import { RBACServiceShareObjectRequest } from "textql-sdk/models/operations";

let value: RBACServiceShareObjectRequest = {
  connectProtocolVersion: 1,
  body: {
    expiresAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                       | Type                                                                                                        | Required                                                                                                    | Description                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                    | *1*                                                                                                         | :heavy_check_mark:                                                                                          | N/A                                                                                                         |
| `connectTimeoutMs`                                                                                          | *number*                                                                                                    | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |
| `body`                                                                                                      | [models.TextqlRpcPublicRbacShareObjectRequest](../../models/textql-rpc-public-rbac-share-object-request.md) | :heavy_check_mark:                                                                                          | N/A                                                                                                         |