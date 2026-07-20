# TextqlRpcPublicMCPUpsertMCPServersRequest

## Example Usage

```typescript
import { TextqlRpcPublicMCPUpsertMCPServersRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicMCPUpsertMCPServersRequest = {
  mcpServers: [
    {
      sseConfig: {},
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                  | Type                                   | Required                               | Description                            |
| -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- |
| `mcpServers`                           | *models.TextqlRpcPublicMCPMCPServer*[] | :heavy_minus_sign:                     | N/A                                    |