# TextqlRpcPublicCellsQuestionsCell

QuestionsCell is the agent's "ask the user structured questions" tool. It is a
 haltable cell: the agent pauses until the user submits or dismisses inline.
 On submit the answers go to the agent; on dismiss only the answered count does
 and the agent waits for the user's next message (the dismissal reason).

## Example Usage

```typescript
import { TextqlRpcPublicCellsQuestionsCell } from "textql-sdk/models";

let value: TextqlRpcPublicCellsQuestionsCell = {};
```

## Fields

| Field                                                                                               | Type                                                                                                | Required                                                                                            | Description                                                                                         |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `status`                                                                                            | [models.TextqlRpcPublicCellsQuestionsStatus](../models/textql-rpc-public-cells-questions-status.md) | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |
| `questions`                                                                                         | [models.TextqlRpcPublicCellsQuestionSpec](../models/textql-rpc-public-cells-question-spec.md)[]     | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |
| `answers`                                                                                           | [models.TextqlRpcPublicCellsQuestionAnswer](../models/textql-rpc-public-cells-question-answer.md)[] | :heavy_minus_sign:                                                                                  | prefill (pending) / summary (answered); sensitive values blanked                                    |
| `answeredCount`                                                                                     | *number*                                                                                            | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |