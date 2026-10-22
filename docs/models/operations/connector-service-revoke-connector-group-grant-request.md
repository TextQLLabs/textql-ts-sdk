# ConnectorServiceRevokeConnectorGroupGrantRequest

## Example Usage

```typescript
import { ConnectorServiceRevokeConnectorGroupGrantRequest } from "@textql/sdk/models/operations";

let value: ConnectorServiceRevokeConnectorGroupGrantRequest = {
  body: {
    groupId: "<id>",
    grantId: "<id>",
  },
};
```

## Fields

| Field                                                                                                                                               | Type                                                                                                                                                | Required                                                                                                                                            | Description                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                                            | *"1"*                                                                                                                                               | :heavy_check_mark:                                                                                                                                  | Define the version of the Connect protocol                                                                                                          |
| `connectTimeoutMs`                                                                                                                                  | *number*                                                                                                                                            | :heavy_minus_sign:                                                                                                                                  | N/A                                                                                                                                                 |
| `body`                                                                                                                                              | [models.TextqlRpcPublicConnectorRevokeConnectorGroupGrantRequest](../../models/textql-rpc-public-connector-revoke-connector-group-grant-request.md) | :heavy_check_mark:                                                                                                                                  | N/A                                                                                                                                                 |