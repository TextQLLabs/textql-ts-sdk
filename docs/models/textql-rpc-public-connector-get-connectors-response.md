# TextqlRpcPublicConnectorGetConnectorsResponse

## Example Usage

```typescript
import { TextqlRpcPublicConnectorGetConnectorsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorGetConnectorsResponse = {
  connectors: [
    {
      fireboltMetadata: {},
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                     | Type                                                                                                      | Required                                                                                                  | Description                                                                                               |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `connectors`                                                                                              | *models.TextqlRpcPublicConnectorConnector*[]                                                              | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `unavailableConnectorTypes`                                                                               | [models.TextqlRpcPublicConnectorConnectorType](../models/textql-rpc-public-connector-connector-type.md)[] | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `teradataUploadRequired`                                                                                  | *boolean*                                                                                                 | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |