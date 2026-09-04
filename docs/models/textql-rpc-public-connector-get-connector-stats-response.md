# TextqlRpcPublicConnectorGetConnectorStatsResponse

A segment of an example query message - either plain text or a styled feature word

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
| `stats`                                                                                                              | [models.TextqlRpcPublicConnectorConnectorStatEntry](../models/textql-rpc-public-connector-connector-stat-entry.md)[] | :heavy_minus_sign:                                                                                                   | The text content of this segment                                                                                     |