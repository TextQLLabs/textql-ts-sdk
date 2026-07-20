# TextqlRpcPublicConnectorListQueryTemplatesRequest

## Example Usage

```typescript
import { TextqlRpcPublicConnectorListQueryTemplatesRequest } from "textql-sdk/models";

let value: TextqlRpcPublicConnectorListQueryTemplatesRequest = {};
```

## Fields

| Field                                                        | Type                                                         | Required                                                     | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `connectorId`                                                | *number*                                                     | :heavy_minus_sign:                                           | N/A                                                          |
| `limit`                                                      | *number*                                                     | :heavy_minus_sign:                                           | N/A                                                          |
| `offset`                                                     | *number*                                                     | :heavy_minus_sign:                                           | N/A                                                          |
| `days`                                                       | *number*                                                     | :heavy_minus_sign:                                           | Optional lookback window in days; 0 or unset means all-time. |