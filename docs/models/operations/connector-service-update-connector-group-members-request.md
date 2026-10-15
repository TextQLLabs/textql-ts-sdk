# ConnectorServiceUpdateConnectorGroupMembersRequest

## Example Usage

```typescript
import { ConnectorServiceUpdateConnectorGroupMembersRequest } from "@textql/sdk/models/operations";

let value: ConnectorServiceUpdateConnectorGroupMembersRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                                                   | Type                                                                                                                                                    | Required                                                                                                                                                | Description                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                                                | *"1"*                                                                                                                                                   | :heavy_check_mark:                                                                                                                                      | Define the version of the Connect protocol                                                                                                              |
| `connectTimeoutMs`                                                                                                                                      | *number*                                                                                                                                                | :heavy_minus_sign:                                                                                                                                      | N/A                                                                                                                                                     |
| `body`                                                                                                                                                  | [models.TextqlRpcPublicConnectorUpdateConnectorGroupMembersRequest](../../models/textql-rpc-public-connector-update-connector-group-members-request.md) | :heavy_check_mark:                                                                                                                                      | N/A                                                                                                                                                     |