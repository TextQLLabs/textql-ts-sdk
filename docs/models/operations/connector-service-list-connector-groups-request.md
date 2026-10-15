# ConnectorServiceListConnectorGroupsRequest

## Example Usage

```typescript
import { ConnectorServiceListConnectorGroupsRequest } from "@textql/sdk/models/operations";

let value: ConnectorServiceListConnectorGroupsRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                                  | Type                                                                                                                                   | Required                                                                                                                               | Description                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                               | *"1"*                                                                                                                                  | :heavy_check_mark:                                                                                                                     | Define the version of the Connect protocol                                                                                             |
| `connectTimeoutMs`                                                                                                                     | *number*                                                                                                                               | :heavy_minus_sign:                                                                                                                     | N/A                                                                                                                                    |
| `body`                                                                                                                                 | [models.TextqlRpcPublicConnectorListConnectorGroupsRequest](../../models/textql-rpc-public-connector-list-connector-groups-request.md) | :heavy_check_mark:                                                                                                                     | N/A                                                                                                                                    |