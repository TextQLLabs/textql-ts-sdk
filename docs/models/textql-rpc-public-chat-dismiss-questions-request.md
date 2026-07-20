# TextqlRpcPublicChatDismissQuestionsRequest

## Example Usage

```typescript
import { TextqlRpcPublicChatDismissQuestionsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicChatDismissQuestionsRequest = {};
```

## Fields

| Field                                                                                               | Type                                                                                                | Required                                                                                            | Description                                                                                         |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `cellId`                                                                                            | *string*                                                                                            | :heavy_minus_sign:                                                                                  | UUID                                                                                                |
| `answers`                                                                                           | [models.TextqlRpcPublicCellsQuestionAnswer](../models/textql-rpc-public-cells-question-answer.md)[] | :heavy_minus_sign:                                                                                  | partial answers                                                                                     |