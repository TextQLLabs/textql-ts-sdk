# TextqlRpcPublicConnectorMongoDBMetadata

## Example Usage

```typescript
import { TextqlRpcPublicConnectorMongoDBMetadata } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorMongoDBMetadata = {};
```

## Fields

| Field                                                         | Type                                                          | Required                                                      | Description                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| `host`                                                        | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `port`                                                        | *number*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `user`                                                        | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `password`                                                    | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `database`                                                    | *string*                                                      | :heavy_minus_sign:                                            | default database to query                                     |
| `authSource`                                                  | *string*                                                      | :heavy_minus_sign:                                            | authSource (e.g. "admin"); defaults to database when empty    |
| `tls`                                                         | *boolean*                                                     | :heavy_minus_sign:                                            | N/A                                                           |
| `srv`                                                         | *boolean*                                                     | :heavy_minus_sign:                                            | mongodb+srv connection (Atlas) — host is the cluster DNS name |