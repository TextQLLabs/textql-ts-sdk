# TextqlRpcPublicScimListScimOAuthClientsResponse

## Example Usage

```typescript
import { TextqlRpcPublicScimListScimOAuthClientsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicScimListScimOAuthClientsResponse = {
  clients: [
    {
      expiresAt: new Date("2023-01-15T01:30:15.01Z"),
      revokedAt: new Date("2023-01-15T01:30:15.01Z"),
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                 | Type                                                                                                  | Required                                                                                              | Description                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `clients`                                                                                             | [models.TextqlRpcPublicScimScimOAuthClient](../models/textql-rpc-public-scim-scim-o-auth-client.md)[] | :heavy_minus_sign:                                                                                    | N/A                                                                                                   |