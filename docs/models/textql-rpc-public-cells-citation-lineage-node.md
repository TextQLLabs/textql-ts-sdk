# TextqlRpcPublicCellsCitationLineageNode

QuestionsCell is the agent's "ask the user structured questions" tool. It is a
 haltable cell: the agent pauses until the user submits or dismisses inline.
 On submit the answers go to the agent; on dismiss only the answered count does
 and the agent waits for the user's next message (the dismissal reason).

## Example Usage

```typescript
import { TextqlRpcPublicCellsCitationLineageNode } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsCitationLineageNode = {};
```

## Fields

| Field                                                            | Type                                                             | Required                                                         | Description                                                      |
| ---------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| `cellId`                                                         | *string*                                                         | :heavy_minus_sign:                                               | N/A                                                              |
| `kind`                                                           | *string*                                                         | :heavy_minus_sign:                                               | N/A                                                              |
| `dataframeName`                                                  | *string*                                                         | :heavy_minus_sign:                                               | prefill (pending) / summary (answered); sensitive values blanked |
| `connectorId`                                                    | *number*                                                         | :heavy_minus_sign:                                               | N/A                                                              |
| `tables`                                                         | *string*[]                                                       | :heavy_minus_sign:                                               | N/A                                                              |
| `inputCellIds`                                                   | *string*[]                                                       | :heavy_minus_sign:                                               | N/A                                                              |