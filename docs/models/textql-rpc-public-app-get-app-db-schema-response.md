# TextqlRpcPublicAppGetAppDBSchemaResponse

## Example Usage

```typescript
import { TextqlRpcPublicAppGetAppDBSchemaResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicAppGetAppDBSchemaResponse = {};
```

## Fields

| Field                                                                                    | Type                                                                                     | Required                                                                                 | Description                                                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `tables`                                                                                 | [models.TextqlRpcPublicAppAppDBTable](../models/textql-rpc-public-app-app-db-table.md)[] | :heavy_minus_sign:                                                                       | N/A                                                                                      |
| `changeLogBytes`                                                                         | *models.TextqlRpcPublicAppGetAppDBSchemaResponseChangeLogBytes*                          | :heavy_minus_sign:                                                                       | Routing observability: warm \| warm_fallback \| tql \| sql.                              |