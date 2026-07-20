# ObservabilityServiceGetActivePeopleTrendRequest

## Example Usage

```typescript
import { ObservabilityServiceGetActivePeopleTrendRequest } from "textql-sdk/models/operations";

let value: ObservabilityServiceGetActivePeopleTrendRequest = {
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
| `body`                                                                                                                                | [models.TextqlRpcPublicObserveGetActivePeopleTrendRequest](../../models/textql-rpc-public-observe-get-active-people-trend-request.md) | :heavy_check_mark:                                                                                                                    | N/A                                                                                                                                   |