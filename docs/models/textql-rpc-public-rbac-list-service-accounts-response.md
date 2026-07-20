# TextqlRpcPublicRbacListServiceAccountsResponse

## Example Usage

```typescript
import { TextqlRpcPublicRbacListServiceAccountsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacListServiceAccountsResponse = {
  serviceAccounts: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                             | Type                                                                                              | Required                                                                                          | Description                                                                                       |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `serviceAccounts`                                                                                 | [models.TextqlRpcPublicRbacServiceAccount](../models/textql-rpc-public-rbac-service-account.md)[] | :heavy_minus_sign:                                                                                | N/A                                                                                               |
| `nextPageToken`                                                                                   | *string*                                                                                          | :heavy_minus_sign:                                                                                | N/A                                                                                               |