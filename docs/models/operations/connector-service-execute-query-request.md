# ConnectorServiceExecuteQueryRequest

## Example Usage

```typescript
import { ConnectorServiceExecuteQueryRequest } from "textql-sdk/models/operations";

let value: ConnectorServiceExecuteQueryRequest = {
  connectProtocolVersion: 1,
  body: {},
};
```

## Fields

| Field                                                                                                                   | Type                                                                                                                    | Required                                                                                                                | Description                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                | *1*                                                                                                                     | :heavy_check_mark:                                                                                                      | N/A                                                                                                                     |
| `connectTimeoutMs`                                                                                                      | *number*                                                                                                                | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `body`                                                                                                                  | [models.TextqlRpcPublicConnectorExecuteQueryRequest](../../models/textql-rpc-public-connector-execute-query-request.md) | :heavy_check_mark:                                                                                                      | N/A                                                                                                                     |