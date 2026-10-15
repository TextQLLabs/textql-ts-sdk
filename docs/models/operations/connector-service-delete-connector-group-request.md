# ConnectorServiceDeleteConnectorGroupRequest

## Example Usage

```typescript
import { ConnectorServiceDeleteConnectorGroupRequest } from "@textql/sdk/models/operations";

let value: ConnectorServiceDeleteConnectorGroupRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                                    | Type                                                                                                                                     | Required                                                                                                                                 | Description                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                                 | *"1"*                                                                                                                                    | :heavy_check_mark:                                                                                                                       | Define the version of the Connect protocol                                                                                               |
| `connectTimeoutMs`                                                                                                                       | *number*                                                                                                                                 | :heavy_minus_sign:                                                                                                                       | N/A                                                                                                                                      |
| `body`                                                                                                                                   | [models.TextqlRpcPublicConnectorDeleteConnectorGroupRequest](../../models/textql-rpc-public-connector-delete-connector-group-request.md) | :heavy_check_mark:                                                                                                                       | N/A                                                                                                                                      |