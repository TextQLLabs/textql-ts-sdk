# TextqlRpcPublicChatGetLlmUsageResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatGetLlmUsageResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicChatGetLlmUsageResponse = {
  usage: [
    {
      timestamp: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                 | Type                                                                                  | Required                                                                              | Description                                                                           |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `usage`                                                                               | [models.TextqlRpcPublicChatLlmUsage](../models/textql-rpc-public-chat-llm-usage.md)[] | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `contextWindowUsed`                                                                   | *number*                                                                              | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `estimatedCost`                                                                       | *number*                                                                              | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `estimatedComputeCost`                                                                | *number*                                                                              | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `sandboxId`                                                                           | *string*                                                                              | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `estimatedComputeAcus`                                                                | *number*                                                                              | :heavy_minus_sign:                                                                    | N/A                                                                                   |