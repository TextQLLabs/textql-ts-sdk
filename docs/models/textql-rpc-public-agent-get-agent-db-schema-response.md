# TextqlRpcPublicAgentGetAgentDBSchemaResponse

## Example Usage

```typescript
import { TextqlRpcPublicAgentGetAgentDBSchemaResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicAgentGetAgentDBSchemaResponse = {};
```

## Fields

| Field                                                                                            | Type                                                                                             | Required                                                                                         | Description                                                                                      |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `tables`                                                                                         | [models.TextqlRpcPublicAgentAgentDBTable](../models/textql-rpc-public-agent-agent-db-table.md)[] | :heavy_minus_sign:                                                                               | N/A                                                                                              |
| `changeLogBytes`                                                                                 | *models.TextqlRpcPublicAgentGetAgentDBSchemaResponseChangeLogBytes*                              | :heavy_minus_sign:                                                                               | durable Postgres change-log size; the .duckdb cache is derived from this                         |