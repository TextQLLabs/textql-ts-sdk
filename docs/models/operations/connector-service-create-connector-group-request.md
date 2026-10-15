# ConnectorServiceCreateConnectorGroupRequest

## Example Usage

```typescript
import { ConnectorServiceCreateConnectorGroupRequest } from "@textql/sdk/models/operations";

let value: ConnectorServiceCreateConnectorGroupRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                                    | Type                                                                                                                                     | Required                                                                                                                                 | Description                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                                 | *"1"*                                                                                                                                    | :heavy_check_mark:                                                                                                                       | Define the version of the Connect protocol                                                                                               |
| `connectTimeoutMs`                                                                                                                       | *number*                                                                                                                                 | :heavy_minus_sign:                                                                                                                       | N/A                                                                                                                                      |
| `body`                                                                                                                                   | [models.TextqlRpcPublicConnectorCreateConnectorGroupRequest](../../models/textql-rpc-public-connector-create-connector-group-request.md) | :heavy_check_mark:                                                                                                                       | N/A                                                                                                                                      |