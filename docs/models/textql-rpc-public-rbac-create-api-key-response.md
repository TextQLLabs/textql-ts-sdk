# TextqlRpcPublicRbacCreateApiKeyResponse

## Example Usage

```typescript
import { TextqlRpcPublicRbacCreateApiKeyResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacCreateApiKeyResponse = {
  apiKey: {
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
    expiresAt: new Date("2023-01-15T01:30:15.01Z"),
    revokedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                           | Type                                                                            | Required                                                                        | Description                                                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `apiKey`                                                                        | [models.TextqlRpcPublicRbacApiKey](../models/textql-rpc-public-rbac-api-key.md) | :heavy_minus_sign:                                                              | N/A                                                                             |
| `apiKeyHash`                                                                    | *string*                                                                        | :heavy_minus_sign:                                                              | N/A                                                                             |