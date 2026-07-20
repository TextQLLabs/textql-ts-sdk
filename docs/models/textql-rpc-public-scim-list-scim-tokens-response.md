# TextqlRpcPublicScimListScimTokensResponse

## Example Usage

```typescript
import { TextqlRpcPublicScimListScimTokensResponse } from "textql-sdk/models";

let value: TextqlRpcPublicScimListScimTokensResponse = {
  tokens: [
    {
      expiresAt: new Date("2023-01-15T01:30:15.01Z"),
      revokedAt: new Date("2023-01-15T01:30:15.01Z"),
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                   | Type                                                                                    | Required                                                                                | Description                                                                             |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `tokens`                                                                                | [models.TextqlRpcPublicScimScimToken](../models/textql-rpc-public-scim-scim-token.md)[] | :heavy_minus_sign:                                                                      | N/A                                                                                     |