# TextqlRpcPublicAgentListAgentRunsResponse

## Example Usage

```typescript
import { TextqlRpcPublicAgentListAgentRunsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicAgentListAgentRunsResponse = {
  runs: [
    {
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
  ],
};
```

## Fields

| Field                                                                                   | Type                                                                                    | Required                                                                                | Description                                                                             |
| --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| `runs`                                                                                  | [models.TextqlRpcPublicAgentAgentRun](../models/textql-rpc-public-agent-agent-run.md)[] | :heavy_minus_sign:                                                                      | N/A                                                                                     |