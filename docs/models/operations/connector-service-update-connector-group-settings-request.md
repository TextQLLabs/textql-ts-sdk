# ConnectorServiceUpdateConnectorGroupSettingsRequest

## Example Usage

```typescript
import { ConnectorServiceUpdateConnectorGroupSettingsRequest } from "@textql/sdk/models/operations";

let value: ConnectorServiceUpdateConnectorGroupSettingsRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                                                     | Type                                                                                                                                                      | Required                                                                                                                                                  | Description                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                                                  | *"1"*                                                                                                                                                     | :heavy_check_mark:                                                                                                                                        | Define the version of the Connect protocol                                                                                                                |
| `connectTimeoutMs`                                                                                                                                        | *number*                                                                                                                                                  | :heavy_minus_sign:                                                                                                                                        | N/A                                                                                                                                                       |
| `body`                                                                                                                                                    | [models.TextqlRpcPublicConnectorUpdateConnectorGroupSettingsRequest](../../models/textql-rpc-public-connector-update-connector-group-settings-request.md) | :heavy_check_mark:                                                                                                                                        | N/A                                                                                                                                                       |