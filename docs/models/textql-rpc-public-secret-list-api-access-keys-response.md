# TextqlRpcPublicSecretListApiAccessKeysResponse

## Example Usage

```typescript
import { TextqlRpcPublicSecretListApiAccessKeysResponse } from "textql-sdk/models";

let value: TextqlRpcPublicSecretListApiAccessKeysResponse = {
  apiAccessKeys: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      expiresAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                              | Type                                                                                               | Required                                                                                           | Description                                                                                        |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `apiAccessKeys`                                                                                    | [models.TextqlRpcPublicSecretApiAccessKey](../models/textql-rpc-public-secret-api-access-key.md)[] | :heavy_minus_sign:                                                                                 | N/A                                                                                                |