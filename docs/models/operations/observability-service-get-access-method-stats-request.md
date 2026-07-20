# ObservabilityServiceGetAccessMethodStatsRequest

## Example Usage

```typescript
import { ObservabilityServiceGetAccessMethodStatsRequest } from "textql-sdk/models/operations";

let value: ObservabilityServiceGetAccessMethodStatsRequest = {
  connectProtocolVersion: 1,
  body: {
    startDate: new Date("2023-01-15T01:30:15.01Z"),
    endDate: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                                                 | Type                                                                                                                                  | Required                                                                                                                              | Description                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                              | *1*                                                                                                                                   | :heavy_check_mark:                                                                                                                    | N/A                                                                                                                                   |
| `connectTimeoutMs`                                                                                                                    | *number*                                                                                                                              | :heavy_minus_sign:                                                                                                                    | N/A                                                                                                                                   |
| `body`                                                                                                                                | [models.TextqlRpcPublicObserveGetAccessMethodStatsRequest](../../models/textql-rpc-public-observe-get-access-method-stats-request.md) | :heavy_check_mark:                                                                                                                    | N/A                                                                                                                                   |