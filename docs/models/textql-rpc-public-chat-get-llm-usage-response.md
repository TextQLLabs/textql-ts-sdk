# TextqlRpcPublicChatGetLlmUsageResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatGetLlmUsageResponse } from "textql-sdk/models";

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
| `contextWindowUsed`                                                                   | *number*                                                                              | :heavy_minus_sign:                                                                    | range: [0, 1]                                                                         |
| `estimatedCost`                                                                       | *number*                                                                              | :heavy_minus_sign:                                                                    | N/A                                                                                   |