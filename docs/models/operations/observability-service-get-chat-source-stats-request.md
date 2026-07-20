# ObservabilityServiceGetChatSourceStatsRequest

## Example Usage

```typescript
import { ObservabilityServiceGetChatSourceStatsRequest } from "textql-sdk/models/operations";

let value: ObservabilityServiceGetChatSourceStatsRequest = {
  body: {
    startDate: new Date("2023-01-15T01:30:15.01Z"),
    endDate: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                                             | Type                                                                                                                              | Required                                                                                                                          | Description                                                                                                                       |
| --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                          | *1*                                                                                                                               | :heavy_check_mark:                                                                                                                | N/A                                                                                                                               |
| `connectTimeoutMs`                                                                                                                | *number*                                                                                                                          | :heavy_minus_sign:                                                                                                                | N/A                                                                                                                               |
| `body`                                                                                                                            | [models.TextqlRpcPublicObserveGetChatSourceStatsRequest](../../models/textql-rpc-public-observe-get-chat-source-stats-request.md) | :heavy_check_mark:                                                                                                                | N/A                                                                                                                               |