# AgentServiceListAgentRunsResponse


## Supported Types

### `models.TextqlRpcPublicAgentListAgentRunsResponse`

```typescript
const value: models.TextqlRpcPublicAgentListAgentRunsResponse = {
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

### `models.ConnectError`

```typescript
const value: models.ConnectError = {
  code: "not_found",
};
```

