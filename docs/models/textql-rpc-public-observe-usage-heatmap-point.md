# TextqlRpcPublicObserveUsageHeatmapPoint

UsageHeatmapPoint is one (weekday, hour) bucket of chat volume, in the
 timezone requested via GetObservabilityStatsRequest.timezone.

## Example Usage

```typescript
import { TextqlRpcPublicObserveUsageHeatmapPoint } from "@textql/sdk/models";

let value: TextqlRpcPublicObserveUsageHeatmapPoint = {};
```

## Fields

| Field                                           | Type                                            | Required                                        | Description                                     |
| ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| `dow`                                           | *number*                                        | :heavy_minus_sign:                              | 0=Sunday .. 6=Saturday (Postgres/JS convention) |
| `hour`                                          | *number*                                        | :heavy_minus_sign:                              | 0-23                                            |
| `total`                                         | *number*                                        | :heavy_minus_sign:                              | N/A                                             |