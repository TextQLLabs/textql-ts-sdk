# TextqlRpcPublicConnectorGetConnectorUsageResponse

## Example Usage

```typescript
import { TextqlRpcPublicConnectorGetConnectorUsageResponse } from "textql-sdk/models";

let value: TextqlRpcPublicConnectorGetConnectorUsageResponse = {};
```

## Fields

| Field                                                                                                          | Type                                                                                                           | Required                                                                                                       | Description                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `dailyVolume`                                                                                                  | [models.TextqlRpcPublicConnectorDailyQueryCount](../models/textql-rpc-public-connector-daily-query-count.md)[] | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `topUsers`                                                                                                     | [models.TextqlRpcPublicConnectorTopUser](../models/textql-rpc-public-connector-top-user.md)[]                  | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `totalQueries`                                                                                                 | *models.TotalQueries*                                                                                          | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `dailyExecutionMs`                                                                                             | [models.TextqlRpcPublicConnectorDailyDuration](../models/textql-rpc-public-connector-daily-duration.md)[]      | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |