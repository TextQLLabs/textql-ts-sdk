# TextqlRpcPublicRbacWhoAmIResponse

Which LLM models the caller may run.

## Example Usage

```typescript
import { TextqlRpcPublicRbacWhoAmIResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacWhoAmIResponse = {
  credential: {
    expiresAt: new Date("2023-01-15T01:30:15.01Z"),
  },
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
  sharedAccess: [
    {
      expiresAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                  | Type                                                                                                   | Required                                                                                               | Description                                                                                            |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `memberId`                                                                                             | *string*                                                                                               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `orgId`                                                                                                | *string*                                                                                               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `email`                                                                                                | *string*                                                                                               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `credential`                                                                                           | [models.TextqlRpcPublicRbacCallerCredential](../models/textql-rpc-public-rbac-caller-credential.md)    | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `roles`                                                                                                | [models.TextqlRpcPublicRbacRole](../models/textql-rpc-public-rbac-role.md)[]                           | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `permissions`                                                                                          | [models.TextqlRpcPublicRbacPermission](../models/textql-rpc-public-rbac-permission.md)[]               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `modelAccess`                                                                                          | [models.TextqlRpcPublicRbacCallerModelAccess](../models/textql-rpc-public-rbac-caller-model-access.md) | :heavy_minus_sign:                                                                                     | WhoAmI messages                                                                                        |
| `sharedAccess`                                                                                         | [models.TextqlRpcPublicRbacSharedObject](../models/textql-rpc-public-rbac-shared-object.md)[]          | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `sharedAccessTruncated`                                                                                | *boolean*                                                                                              | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |