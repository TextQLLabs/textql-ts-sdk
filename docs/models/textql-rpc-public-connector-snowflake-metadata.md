# TextqlRpcPublicConnectorSnowflakeMetadata

## Example Usage

```typescript
import { TextqlRpcPublicConnectorSnowflakeMetadata } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorSnowflakeMetadata = {};
```

## Fields

| Field                                                         | Type                                                          | Required                                                      | Description                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| `username`                                                    | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `password`                                                    | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `privateKey`                                                  | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `privateKeyPassphrase`                                        | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `role`                                                        | *string*                                                      | :heavy_minus_sign:                                            | default database to query                                     |
| `schema`                                                      | *string*                                                      | :heavy_minus_sign:                                            | authSource (e.g. "admin"); defaults to database when empty    |
| `locator`                                                     | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `database`                                                    | *string*                                                      | :heavy_minus_sign:                                            | mongodb+srv connection (Atlas) — host is the cluster DNS name |
| `warehouse`                                                   | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `oauthAccessToken`                                            | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `oauthRefreshToken`                                           | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `oauthClientId`                                               | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `oauthClientSecret`                                           | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `enableSsoAuth`                                               | *boolean*                                                     | :heavy_minus_sign:                                            | N/A                                                           |
| `tokenExchangeEndpoint`                                       | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `tokenExchangeAudience`                                       | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `tokenExchangeScope`                                          | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |