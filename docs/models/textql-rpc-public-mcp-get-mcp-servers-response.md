# TextqlRpcPublicMCPGetMCPServersResponse

## Example Usage

```typescript
import { TextqlRpcPublicMCPGetMCPServersResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicMCPGetMCPServersResponse = {
  mcpServers: [
    {
      mcpServer: {
        httpConfig: {},
        createdAt: new Date("2023-01-15T01:30:15.01Z"),
        updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      },
    },
  ],
};
```

## Fields

| Field                                                                                                    | Type                                                                                                     | Required                                                                                                 | Description                                                                                              |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `mcpServers`                                                                                             | [models.TextqlRpcPublicMCPMCPServerWithTools](../models/textql-rpc-public-mcpmcp-server-with-tools.md)[] | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |