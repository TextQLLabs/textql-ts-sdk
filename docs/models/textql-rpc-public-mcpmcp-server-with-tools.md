# TextqlRpcPublicMCPMCPServerWithTools

## Example Usage

```typescript
import { TextqlRpcPublicMCPMCPServerWithTools } from "@textql/sdk/models";

let value: TextqlRpcPublicMCPMCPServerWithTools = {
  mcpServer: {
    httpConfig: {},
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                            | Type                                                                             | Required                                                                         | Description                                                                      |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `mcpServer`                                                                      | *models.TextqlRpcPublicMCPMCPServer*                                             | :heavy_minus_sign:                                                               | N/A                                                                              |
| `tools`                                                                          | [models.TextqlRpcPublicMCPMCPTool](../models/textql-rpc-public-mcpmcp-tool.md)[] | :heavy_minus_sign:                                                               | N/A                                                                              |
| `error`                                                                          | [models.TextqlRpcPublicMCPMCPError](../models/textql-rpc-public-mcpmcp-error.md) | :heavy_minus_sign:                                                               | N/A                                                                              |