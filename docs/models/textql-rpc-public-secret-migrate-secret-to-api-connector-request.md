# TextqlRpcPublicSecretMigrateSecretToApiConnectorRequest

## Example Usage

```typescript
import { TextqlRpcPublicSecretMigrateSecretToApiConnectorRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicSecretMigrateSecretToApiConnectorRequest = {};
```

## Fields

| Field                                                                      | Type                                                                       | Required                                                                   | Description                                                                |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `secretName`                                                               | *string*                                                                   | :heavy_minus_sign:                                                         | N/A                                                                        |
| `apiAccessKeyId`                                                           | *string*                                                                   | :heavy_minus_sign:                                                         | empty = create new API connector                                           |
| `headerName`                                                               | *string*                                                                   | :heavy_minus_sign:                                                         | N/A                                                                        |
| `hosts`                                                                    | *string*[]                                                                 | :heavy_minus_sign:                                                         | Fields used when creating a new API connector (api_access_key_id is empty) |
| `description`                                                              | *string*                                                                   | :heavy_minus_sign:                                                         | N/A                                                                        |
| `valuePrefix`                                                              | *string*                                                                   | :heavy_minus_sign:                                                         | e.g. "Bearer ", prepended to the secret value                              |
| `name`                                                                     | *string*                                                                   | :heavy_minus_sign:                                                         | display name for the new API connector                                     |