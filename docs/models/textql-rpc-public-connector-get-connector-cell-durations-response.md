# TextqlRpcPublicConnectorGetConnectorCellDurationsResponse

## Example Usage

```typescript
import { TextqlRpcPublicConnectorGetConnectorCellDurationsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorGetConnectorCellDurationsResponse = {
  cells: [
    {
      startedAt: new Date("2023-01-15T01:30:15.01Z"),
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                      | Type                                                                                                                       | Required                                                                                                                   | Description                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `cells`                                                                                                                    | [models.TextqlRpcPublicConnectorConnectorCellDuration](../models/textql-rpc-public-connector-connector-cell-duration.md)[] | :heavy_minus_sign:                                                                                                         | N/A                                                                                                                        |
| `totalCount`                                                                                                               | *models.TotalCount*                                                                                                        | :heavy_minus_sign:                                                                                                         | N/A                                                                                                                        |