# ConnectorServiceUpdateConnectorGroupRequest

## Example Usage

```typescript
import { ConnectorServiceUpdateConnectorGroupRequest } from "@textql/sdk/models/operations";

let value: ConnectorServiceUpdateConnectorGroupRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                                    | Type                                                                                                                                     | Required                                                                                                                                 | Description                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                                 | *"1"*                                                                                                                                    | :heavy_check_mark:                                                                                                                       | Define the version of the Connect protocol                                                                                               |
| `connectTimeoutMs`                                                                                                                       | *number*                                                                                                                                 | :heavy_minus_sign:                                                                                                                       | N/A                                                                                                                                      |
| `body`                                                                                                                                   | [models.TextqlRpcPublicConnectorUpdateConnectorGroupRequest](../../models/textql-rpc-public-connector-update-connector-group-request.md) | :heavy_check_mark:                                                                                                                       | N/A                                                                                                                                      |