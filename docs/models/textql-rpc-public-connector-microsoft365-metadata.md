# TextqlRpcPublicConnectorMicrosoft365Metadata

## Example Usage

```typescript
import { TextqlRpcPublicConnectorMicrosoft365Metadata } from "textql-sdk/models";

let value: TextqlRpcPublicConnectorMicrosoft365Metadata = {};
```

## Fields

| Field                                                          | Type                                                           | Required                                                       | Description                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| `tenantId`                                                     | *string*                                                       | :heavy_minus_sign:                                             | N/A                                                            |
| `clientId`                                                     | *string*                                                       | :heavy_minus_sign:                                             | N/A                                                            |
| `clientSecret`                                                 | *string*                                                       | :heavy_minus_sign:                                             | N/A                                                            |
| `accessToken`                                                  | *string*                                                       | :heavy_minus_sign:                                             | N/A                                                            |
| `refreshToken`                                                 | *string*                                                       | :heavy_minus_sign:                                             | N/A                                                            |
| `memberId`                                                     | *string*                                                       | :heavy_minus_sign:                                             | N/A                                                            |
| `tokenExpiry`                                                  | *string*                                                       | :heavy_minus_sign:                                             | ISO 8601 timestamp                                             |
| `metadataOnly`                                                 | *boolean*                                                      | :heavy_minus_sign:                                             | When true, only email metadata is accessible (no body content) |
| `scopes`                                                       | *string*[]                                                     | :heavy_minus_sign:                                             | N/A                                                            |