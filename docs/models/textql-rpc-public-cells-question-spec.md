# TextqlRpcPublicCellsQuestionSpec

## Example Usage

```typescript
import { TextqlRpcPublicCellsQuestionSpec } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsQuestionSpec = {};
```

## Fields

| Field                                                                                               | Type                                                                                                | Required                                                                                            | Description                                                                                         |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `question`                                                                                          | *string*                                                                                            | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |
| `explanation`                                                                                       | *string*                                                                                            | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |
| `kind`                                                                                              | [models.TextqlRpcPublicCellsQuestionKind](../models/textql-rpc-public-cells-question-kind.md)       | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |
| `options`                                                                                           | [models.TextqlRpcPublicCellsQuestionOption](../models/textql-rpc-public-cells-question-option.md)[] | :heavy_minus_sign:                                                                                  | choice / multichoice                                                                                |
| `allowCustom`                                                                                       | *boolean*                                                                                           | :heavy_minus_sign:                                                                                  | adds a free-text "Other" option                                                                     |
| `inputs`                                                                                            | [models.TextqlRpcPublicCellsQuestionInput](../models/textql-rpc-public-cells-question-input.md)[]   | :heavy_minus_sign:                                                                                  | inputs                                                                                              |