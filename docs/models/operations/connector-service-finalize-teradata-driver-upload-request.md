# ConnectorServiceFinalizeTeradataDriverUploadRequest

## Example Usage

```typescript
import { ConnectorServiceFinalizeTeradataDriverUploadRequest } from "@textql/sdk/models/operations";

let value: ConnectorServiceFinalizeTeradataDriverUploadRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                                                     | Type                                                                                                                                                      | Required                                                                                                                                                  | Description                                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                                                  | *"1"*                                                                                                                                                     | :heavy_check_mark:                                                                                                                                        | Define the version of the Connect protocol                                                                                                                |
| `connectTimeoutMs`                                                                                                                                        | *number*                                                                                                                                                  | :heavy_minus_sign:                                                                                                                                        | N/A                                                                                                                                                       |
| `body`                                                                                                                                                    | [models.TextqlRpcPublicConnectorFinalizeTeradataDriverUploadRequest](../../models/textql-rpc-public-connector-finalize-teradata-driver-upload-request.md) | :heavy_check_mark:                                                                                                                                        | N/A                                                                                                                                                       |