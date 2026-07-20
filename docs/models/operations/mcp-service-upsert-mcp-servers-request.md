# MCPServiceUpsertMCPServersRequest

## Example Usage

```typescript
import { MCPServiceUpsertMCPServersRequest } from "textql-sdk/models/operations";

let value: MCPServiceUpsertMCPServersRequest = {
  connectProtocolVersion: 1,
  body: {
    mcpServers: [
      {
        sseConfig: {},
        createdAt: new Date("2023-01-15T01:30:15.01Z"),
        updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      },
    ],
  },
};
```

## Fields

| Field                                                                                                                | Type                                                                                                                 | Required                                                                                                             | Description                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                             | *1*                                                                                                                  | :heavy_check_mark:                                                                                                   | N/A                                                                                                                  |
| `connectTimeoutMs`                                                                                                   | *number*                                                                                                             | :heavy_minus_sign:                                                                                                   | N/A                                                                                                                  |
| `body`                                                                                                               | [models.TextqlRpcPublicMCPUpsertMCPServersRequest](../../models/textql-rpc-public-mcp-upsert-mcp-servers-request.md) | :heavy_check_mark:                                                                                                   | N/A                                                                                                                  |