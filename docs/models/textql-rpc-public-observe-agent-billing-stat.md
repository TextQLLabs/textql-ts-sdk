# TextqlRpcPublicObserveAgentBillingStat

## Example Usage

```typescript
import { TextqlRpcPublicObserveAgentBillingStat } from "@textql/sdk/models";

let value: TextqlRpcPublicObserveAgentBillingStat = {};
```

## Fields

| Field                                                                                    | Type                                                                                     | Required                                                                                 | Description                                                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `agentId`                                                                                | *string*                                                                                 | :heavy_minus_sign:                                                                       | N/A                                                                                      |
| `estimatedAcu`                                                                           | *number*                                                                                 | :heavy_minus_sign:                                                                       | proportionally distributed from feed ACU by the agent's chat LLM tokens and sandbox time |