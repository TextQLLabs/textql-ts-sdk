# AgentServiceCreateAgentRequest

## Example Usage

```typescript
import { AgentServiceCreateAgentRequest } from "textql-sdk/models/operations";

let value: AgentServiceCreateAgentRequest = {
  connectProtocolVersion: 1,
  body: {},
};
```

## Fields

| Field                                                                                                         | Type                                                                                                          | Required                                                                                                      | Description                                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                      | *1*                                                                                                           | :heavy_check_mark:                                                                                            | N/A                                                                                                           |
| `connectTimeoutMs`                                                                                            | *number*                                                                                                      | :heavy_minus_sign:                                                                                            | N/A                                                                                                           |
| `body`                                                                                                        | [models.TextqlRpcPublicAgentCreateAgentRequest](../../models/textql-rpc-public-agent-create-agent-request.md) | :heavy_check_mark:                                                                                            | N/A                                                                                                           |