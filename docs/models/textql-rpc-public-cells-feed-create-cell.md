# TextqlRpcPublicCellsFeedCreateCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsFeedCreateCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsFeedCreateCell = {
  agent: {
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                | Type                                                                                                 | Required                                                                                             | Description                                                                                          |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `action`                                                                                             | [models.TextqlRpcPublicCellsFeedAgentAction](../models/textql-rpc-public-cells-feed-agent-action.md) | :heavy_minus_sign:                                                                                   | N/A                                                                                                  |
| `agent`                                                                                              | [models.TextqlRpcPublicCellsFeedAgentInfo](../models/textql-rpc-public-cells-feed-agent-info.md)     | :heavy_minus_sign:                                                                                   | N/A                                                                                                  |
| `errorMessage`                                                                                       | *string*                                                                                             | :heavy_minus_sign:                                                                                   | N/A                                                                                                  |
| `updatedFields`                                                                                      | *string*[]                                                                                           | :heavy_minus_sign:                                                                                   | N/A                                                                                                  |
| `fieldChanges`                                                                                       | [models.TextqlRpcPublicCellsFieldChange](../models/textql-rpc-public-cells-field-change.md)[]        | :heavy_minus_sign:                                                                                   | N/A                                                                                                  |
| `connectors`                                                                                         | [models.TextqlRpcPublicCellsConnectorRef](../models/textql-rpc-public-cells-connector-ref.md)[]      | :heavy_minus_sign:                                                                                   | N/A                                                                                                  |