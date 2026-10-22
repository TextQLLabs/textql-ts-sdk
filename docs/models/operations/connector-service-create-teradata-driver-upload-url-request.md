# ConnectorServiceCreateTeradataDriverUploadUrlRequest

## Example Usage

```typescript
import { ConnectorServiceCreateTeradataDriverUploadUrlRequest } from "@textql/sdk/models/operations";

let value: ConnectorServiceCreateTeradataDriverUploadUrlRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                                                        | Type                                                                                                                                                         | Required                                                                                                                                                     | Description                                                                                                                                                  |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `connectProtocolVersion`                                                                                                                                     | *"1"*                                                                                                                                                        | :heavy_check_mark:                                                                                                                                           | Define the version of the Connect protocol                                                                                                                   |
| `connectTimeoutMs`                                                                                                                                           | *number*                                                                                                                                                     | :heavy_minus_sign:                                                                                                                                           | N/A                                                                                                                                                          |
| `body`                                                                                                                                                       | [models.TextqlRpcPublicConnectorCreateTeradataDriverUploadUrlRequest](../../models/textql-rpc-public-connector-create-teradata-driver-upload-url-request.md) | :heavy_check_mark:                                                                                                                                           | N/A                                                                                                                                                          |