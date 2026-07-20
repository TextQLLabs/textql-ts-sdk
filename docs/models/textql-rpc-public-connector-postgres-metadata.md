# TextqlRpcPublicConnectorPostgresMetadata

## Example Usage

```typescript
import { TextqlRpcPublicConnectorPostgresMetadata } from "textql-sdk/models";

let value: TextqlRpcPublicConnectorPostgresMetadata = {};
```

## Fields

| Field                            | Type                             | Required                         | Description                      |
| -------------------------------- | -------------------------------- | -------------------------------- | -------------------------------- |
| `host`                           | *string*                         | :heavy_minus_sign:               | N/A                              |
| `port`                           | *number*                         | :heavy_minus_sign:               | N/A                              |
| `user`                           | *string*                         | :heavy_minus_sign:               | N/A                              |
| `password`                       | *string*                         | :heavy_minus_sign:               | N/A                              |
| `database`                       | *string*                         | :heavy_minus_sign:               | N/A                              |
| `schemas`                        | *string*[]                       | :heavy_minus_sign:               | N/A                              |
| `dialect`                        | *string*                         | :heavy_minus_sign:               | N/A                              |
| `sslMode`                        | *boolean*                        | :heavy_minus_sign:               | N/A                              |
| `sshTunnelEnabled`               | *boolean*                        | :heavy_minus_sign:               | SSH tunnel / bastion host fields |
| `sshHost`                        | *string*                         | :heavy_minus_sign:               | N/A                              |
| `sshPort`                        | *number*                         | :heavy_minus_sign:               | N/A                              |
| `sshUser`                        | *string*                         | :heavy_minus_sign:               | N/A                              |
| `sshPrivateKey`                  | *string*                         | :heavy_minus_sign:               | N/A                              |
| `sshHostPublicKey`               | *string*                         | :heavy_minus_sign:               | N/A                              |
| `secretsManagerSecretArn`        | *string*                         | :heavy_minus_sign:               | N/A                              |
| `secretsManagerRoleArn`          | *string*                         | :heavy_minus_sign:               | N/A                              |
| `secretsManagerExternalId`       | *string*                         | :heavy_minus_sign:               | N/A                              |