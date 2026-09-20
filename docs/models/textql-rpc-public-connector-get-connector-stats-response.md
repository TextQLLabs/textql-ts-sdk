# TextqlRpcPublicConnectorGetConnectorStatsResponse

## Example Usage

```typescript
import { TextqlRpcPublicConnectorGetConnectorStatsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorGetConnectorStatsResponse = {
  stats: [
    {
      lastQueriedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                | Type                                                                                                                 | Required                                                                                                             | Description                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `stats`                                                                                                              | [models.TextqlRpcPublicConnectorConnectorStatEntry](../models/textql-rpc-public-connector-connector-stat-entry.md)[] | :heavy_minus_sign:                                                                                                   | N/A                                                                                                                  |