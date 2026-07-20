# ObservabilityServiceBackfillCustomTopicRequest

## Example Usage

```typescript
import { ObservabilityServiceBackfillCustomTopicRequest } from "@textql/sdk/models/operations";

let value: ObservabilityServiceBackfillCustomTopicRequest = {
  body: {
    startDate: new Date("2023-01-15T01:30:15.01Z"),
    endDate: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                                              | Type                                                                                                                               | Required                                                                                                                           | Description                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                           | *1*                                                                                                                                | :heavy_check_mark:                                                                                                                 | N/A                                                                                                                                |
| `connectTimeoutMs`                                                                                                                 | *number*                                                                                                                           | :heavy_minus_sign:                                                                                                                 | N/A                                                                                                                                |
| `body`                                                                                                                             | [models.TextqlRpcPublicObserveBackfillCustomTopicRequest](../../models/textql-rpc-public-observe-backfill-custom-topic-request.md) | :heavy_check_mark:                                                                                                                 | N/A                                                                                                                                |