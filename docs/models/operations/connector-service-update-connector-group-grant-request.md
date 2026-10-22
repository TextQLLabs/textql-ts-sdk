# ConnectorServiceUpdateConnectorGroupGrantRequest

## Example Usage

```typescript
import { ConnectorServiceUpdateConnectorGroupGrantRequest } from "@textql/sdk/models/operations";

let value: ConnectorServiceUpdateConnectorGroupGrantRequest = {
  body: {
    groupId: "<id>",
    grantId: "<id>",
    accessType: "<value>",
  },
};
```

## Fields

| Field                                                                                                                                               | Type                                                                                                                                                | Required                                                                                                                                            | Description                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                                            | *"1"*                                                                                                                                               | :heavy_check_mark:                                                                                                                                  | Define the version of the Connect protocol                                                                                                          |
| `connectTimeoutMs`                                                                                                                                  | *number*                                                                                                                                            | :heavy_minus_sign:                                                                                                                                  | N/A                                                                                                                                                 |
| `body`                                                                                                                                              | [models.TextqlRpcPublicConnectorUpdateConnectorGroupGrantRequest](../../models/textql-rpc-public-connector-update-connector-group-grant-request.md) | :heavy_check_mark:                                                                                                                                  | N/A                                                                                                                                                 |