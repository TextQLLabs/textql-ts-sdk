# TextqlRpcPublicSecretCreateApiRevisionResponse

## Example Usage

```typescript
import { TextqlRpcPublicSecretCreateApiRevisionResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicSecretCreateApiRevisionResponse = {
  apiAccessKey: {
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    expiresAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                            | Type                                                                                             | Required                                                                                         | Description                                                                                      |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `ref`                                                                                            | [models.TextqlRpcPublicSecretApiAccessRef](../models/textql-rpc-public-secret-api-access-ref.md) | :heavy_minus_sign:                                                                               | N/A                                                                                              |
| `apiAccessKey`                                                                                   | [models.TextqlRpcPublicSecretApiAccessKey](../models/textql-rpc-public-secret-api-access-key.md) | :heavy_minus_sign:                                                                               | N/A                                                                                              |