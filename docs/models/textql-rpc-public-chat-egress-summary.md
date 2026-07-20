# TextqlRpcPublicChatEgressSummary

## Example Usage

```typescript
import { TextqlRpcPublicChatEgressSummary } from "textql-sdk/models";

let value: TextqlRpcPublicChatEgressSummary = {
  calls: [
    {
      occurredAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                     | Type                                                                                      | Required                                                                                  | Description                                                                               |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `totalCalls`                                                                              | *number*                                                                                  | :heavy_minus_sign:                                                                        | N/A                                                                                       |
| `outcomeCounts`                                                                           | Record<string, *number*>                                                                  | :heavy_minus_sign:                                                                        | outcome -> count (ok/denied/error)                                                        |
| `calls`                                                                                   | [models.TextqlRpcPublicChatEgressCall](../models/textql-rpc-public-chat-egress-call.md)[] | :heavy_minus_sign:                                                                        | bounded; newest first                                                                     |