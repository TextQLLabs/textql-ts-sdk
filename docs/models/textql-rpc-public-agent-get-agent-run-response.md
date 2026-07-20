# TextqlRpcPublicAgentGetAgentRunResponse

## Example Usage

```typescript
import { TextqlRpcPublicAgentGetAgentRunResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicAgentGetAgentRunResponse = {
  run: {
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
    startedAt: new Date("2023-01-15T01:30:15.01Z"),
    finishedAt: new Date("2023-01-15T01:30:15.01Z"),
    egressSummary: {
      calls: [
        {
          occurredAt: new Date("2023-01-15T01:30:15.01Z"),
        },
      ],
    },
  },
};
```

## Fields

| Field                                                                                 | Type                                                                                  | Required                                                                              | Description                                                                           |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `run`                                                                                 | [models.TextqlRpcPublicAgentAgentRun](../models/textql-rpc-public-agent-agent-run.md) | :heavy_minus_sign:                                                                    | N/A                                                                                   |