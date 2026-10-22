# ConnectorServiceListConnectorGroupGrantsRequest

## Example Usage

```typescript
import { ConnectorServiceListConnectorGroupGrantsRequest } from "@textql/sdk/models/operations";

let value: ConnectorServiceListConnectorGroupGrantsRequest = {
  body: {
    groupId: "<id>",
  },
};
```

## Fields

| Field                                                                                                                                             | Type                                                                                                                                              | Required                                                                                                                                          | Description                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                                          | *"1"*                                                                                                                                             | :heavy_check_mark:                                                                                                                                | Define the version of the Connect protocol                                                                                                        |
| `connectTimeoutMs`                                                                                                                                | *number*                                                                                                                                          | :heavy_minus_sign:                                                                                                                                | N/A                                                                                                                                               |
| `body`                                                                                                                                            | [models.TextqlRpcPublicConnectorListConnectorGroupGrantsRequest](../../models/textql-rpc-public-connector-list-connector-group-grants-request.md) | :heavy_check_mark:                                                                                                                                | N/A                                                                                                                                               |