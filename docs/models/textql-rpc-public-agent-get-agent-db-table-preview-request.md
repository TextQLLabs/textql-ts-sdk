# TextqlRpcPublicAgentGetAgentDBTablePreviewRequest

## Example Usage

```typescript
import { TextqlRpcPublicAgentGetAgentDBTablePreviewRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAgentGetAgentDBTablePreviewRequest = {};
```

## Fields

| Field                                   | Type                                    | Required                                | Description                             |
| --------------------------------------- | --------------------------------------- | --------------------------------------- | --------------------------------------- |
| `agentId`                               | *string*                                | :heavy_minus_sign:                      | N/A                                     |
| `tableName`                             | *string*                                | :heavy_minus_sign:                      | N/A                                     |
| `limit`                                 | *number*                                | :heavy_minus_sign:                      | clamped server-side; 0 uses the default |