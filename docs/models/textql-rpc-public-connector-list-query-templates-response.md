# TextqlRpcPublicConnectorListQueryTemplatesResponse

## Example Usage

```typescript
import { TextqlRpcPublicConnectorListQueryTemplatesResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorListQueryTemplatesResponse = {
  templates: [
    {
      firstSeen: new Date("2023-01-15T01:30:15.01Z"),
      lastSeen: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                     | Type                                                                                                      | Required                                                                                                  | Description                                                                                               |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `templates`                                                                                               | [models.TextqlRpcPublicConnectorQueryTemplate](../models/textql-rpc-public-connector-query-template.md)[] | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `totalCount`                                                                                              | *number*                                                                                                  | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |