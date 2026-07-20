# TextqlRpcPublicConnectorKdbMetadata

KdbMetadata configures a kdb+ (kx/q) connector. kdb+ speaks its own binary IPC
 protocol (not SQL), so queries are qSQL strings; see pkg/connectors/kdbipc.

## Example Usage

```typescript
import { TextqlRpcPublicConnectorKdbMetadata } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorKdbMetadata = {};
```

## Fields

| Field                            | Type                             | Required                         | Description                      |
| -------------------------------- | -------------------------------- | -------------------------------- | -------------------------------- |
| `host`                           | *string*                         | :heavy_minus_sign:               | N/A                              |
| `port`                           | *number*                         | :heavy_minus_sign:               | N/A                              |
| `user`                           | *string*                         | :heavy_minus_sign:               | N/A                              |
| `password`                       | *string*                         | :heavy_minus_sign:               | N/A                              |
| `tls`                            | *boolean*                        | :heavy_minus_sign:               | N/A                              |
| `sshTunnelEnabled`               | *boolean*                        | :heavy_minus_sign:               | SSH tunnel / bastion host fields |
| `sshHost`                        | *string*                         | :heavy_minus_sign:               | N/A                              |
| `sshPort`                        | *number*                         | :heavy_minus_sign:               | N/A                              |
| `sshUser`                        | *string*                         | :heavy_minus_sign:               | N/A                              |
| `sshPrivateKey`                  | *string*                         | :heavy_minus_sign:               | N/A                              |
| `sshHostPublicKey`               | *string*                         | :heavy_minus_sign:               | N/A                              |