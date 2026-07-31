# TextqlRpcPublicRbacRotateApiKeyResponse

## Example Usage

```typescript
import { TextqlRpcPublicRbacRotateApiKeyResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacRotateApiKeyResponse = {
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
| `apiKeySecret`                                                                  | *string*                                                                        | :heavy_minus_sign:                                                              | N/A                                                                             |
| `revokedApiKeyId`                                                               | *string*                                                                        | :heavy_minus_sign:                                                              | N/A                                                                             |