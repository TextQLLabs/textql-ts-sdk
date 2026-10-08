# RBACServiceShareObjectRequest

## Example Usage

```typescript
import { RBACServiceShareObjectRequest } from "@textql/sdk/models/operations";

let value: RBACServiceShareObjectRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                       | Type                                                                                                        | Required                                                                                                    | Description                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                    | *"1"*                                                                                                       | :heavy_check_mark:                                                                                          | Define the version of the Connect protocol                                                                  |
| `connectTimeoutMs`                                                                                          | *number*                                                                                                    | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |
| `body`                                                                                                      | [models.TextqlRpcPublicRbacShareObjectRequest](../../models/textql-rpc-public-rbac-share-object-request.md) | :heavy_check_mark:                                                                                          | N/A                                                                                                         |