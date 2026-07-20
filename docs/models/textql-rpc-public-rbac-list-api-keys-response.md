# TextqlRpcPublicRbacListApiKeysResponse

## Example Usage

```typescript
import { TextqlRpcPublicRbacListApiKeysResponse } from "textql-sdk/models";

let value: TextqlRpcPublicRbacListApiKeysResponse = {
  apiKeys: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      expiresAt: new Date("2023-01-15T01:30:15.01Z"),
      revokedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                             | Type                                                                              | Required                                                                          | Description                                                                       |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `apiKeys`                                                                         | [models.TextqlRpcPublicRbacApiKey](../models/textql-rpc-public-rbac-api-key.md)[] | :heavy_minus_sign:                                                                | N/A                                                                               |
| `nextPageToken`                                                                   | *string*                                                                          | :heavy_minus_sign:                                                                | N/A                                                                               |