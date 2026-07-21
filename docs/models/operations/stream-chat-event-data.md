# StreamChatEventData

One stream envelope: `result` carries the next cell, `error` reports a failure that ended the stream.

## Example Usage

```typescript
import { StreamChatEventData } from "@textql/sdk/models/operations";

let value: StreamChatEventData = {
  result: {
    questionsCell: {},
    timestamp: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                       | Type                                                        | Required                                                    | Description                                                 |
| ----------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `result`                                                    | *models.TextqlRpcPublicChatCell*                            | :heavy_minus_sign:                                          | N/A                                                         |
| `error`                                                     | [models.GoogleRpcStatus](../../models/google-rpc-status.md) | :heavy_minus_sign:                                          | N/A                                                         |