# Postgres

## Example Usage

```typescript
import { Postgres } from "@textql/sdk/models";

let value: Postgres = {
  postgres: {},
};
```

## Fields

| Field                                                                                                         | Type                                                                                                          | Required                                                                                                      | Description                                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `postgres`                                                                                                    | [models.TextqlRpcPublicConnectorPostgresMetadata](../models/textql-rpc-public-connector-postgres-metadata.md) | :heavy_check_mark:                                                                                            | N/A                                                                                                           |
| `connectorType`                                                                                               | [models.TextqlRpcPublicConnectorConnectorType](../models/textql-rpc-public-connector-connector-type.md)       | :heavy_minus_sign:                                                                                            | N/A                                                                                                           |
| `name`                                                                                                        | *string*                                                                                                      | :heavy_minus_sign:                                                                                            | N/A                                                                                                           |
| `authStrategy`                                                                                                | *string*                                                                                                      | :heavy_minus_sign:                                                                                            | N/A                                                                                                           |