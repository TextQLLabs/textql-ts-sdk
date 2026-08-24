# TextqlRpcPublicChatDismissQuestionsRequest

## Example Usage

```typescript
import { TextqlRpcPublicChatDismissQuestionsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicChatDismissQuestionsRequest = {
  cellId: "<id>",
};
```

## Fields

| Field                                                                                               | Type                                                                                                | Required                                                                                            | Description                                                                                         |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `cellId`                                                                                            | *string*                                                                                            | :heavy_check_mark:                                                                                  | UUID                                                                                                |
| `answers`                                                                                           | [models.TextqlRpcPublicCellsQuestionAnswer](../models/textql-rpc-public-cells-question-answer.md)[] | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |