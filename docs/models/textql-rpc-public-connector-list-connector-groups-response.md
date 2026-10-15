# TextqlRpcPublicConnectorListConnectorGroupsResponse

## Example Usage

```typescript
import { TextqlRpcPublicConnectorListConnectorGroupsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorListConnectorGroupsResponse = {
  groups: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                       | Type                                                                                                        | Required                                                                                                    | Description                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `groups`                                                                                                    | [models.TextqlRpcPublicConnectorConnectorGroup](../models/textql-rpc-public-connector-connector-group.md)[] | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |
| `addableConnectorIds`                                                                                       | *number*[]                                                                                                  | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |