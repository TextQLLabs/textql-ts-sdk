# SecretServiceUpsertApiAccessKeyRequest

## Example Usage

```typescript
import { SecretServiceUpsertApiAccessKeyRequest } from "textql-sdk/models/operations";

let value: SecretServiceUpsertApiAccessKeyRequest = {
  connectProtocolVersion: 1,
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
| `body`                                                                                                                          | [models.TextqlRpcPublicSecretUpsertApiAccessKeyRequest](../../models/textql-rpc-public-secret-upsert-api-access-key-request.md) | :heavy_check_mark:                                                                                                              | N/A                                                                                                                             |