# TextqlRpcPublicObserveGetObservabilityStatsRequest

## Example Usage

```typescript
import { TextqlRpcPublicObserveGetObservabilityStatsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicObserveGetObservabilityStatsRequest = {};
```

## Fields

| Field                                                                                                                                               | Type                                                                                                                                                | Required                                                                                                                                            | Description                                                                                                                                         |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `days`                                                                                                                                              | *number*                                                                                                                                            | :heavy_minus_sign:                                                                                                                                  | time window: 7, 14, 30, 90                                                                                                                          |
| `timezone`                                                                                                                                          | *string*                                                                                                                                            | :heavy_minus_sign:                                                                                                                                  | IANA timezone (e.g. "America/New_York") used to bucket the usage heatmap<br/> by the viewer's local weekday/hour. Falls back to UTC when unset/invalid. |