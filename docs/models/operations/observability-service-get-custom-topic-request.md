# ObservabilityServiceGetCustomTopicRequest

## Example Usage

```typescript
import { ObservabilityServiceGetCustomTopicRequest } from "@textql/sdk/models/operations";

let value: ObservabilityServiceGetCustomTopicRequest = {
  body: {
    trendStart: new Date("2023-01-15T01:30:15.01Z"),
    trendEnd: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                                    | Type                                                                                                                     | Required                                                                                                                 | Description                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `connectProtocolVersion`                                                                                                 | *1*                                                                                                                      | :heavy_check_mark:                                                                                                       | N/A                                                                                                                      |
| `connectTimeoutMs`                                                                                                       | *number*                                                                                                                 | :heavy_minus_sign:                                                                                                       | N/A                                                                                                                      |
| `body`                                                                                                                   | [models.TextqlRpcPublicObserveGetCustomTopicRequest](../../models/textql-rpc-public-observe-get-custom-topic-request.md) | :heavy_check_mark:                                                                                                       | N/A                                                                                                                      |