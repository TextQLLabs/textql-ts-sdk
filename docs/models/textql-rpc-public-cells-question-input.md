# TextqlRpcPublicCellsQuestionInput

## Example Usage

```typescript
import { TextqlRpcPublicCellsQuestionInput } from "textql-sdk/models";

let value: TextqlRpcPublicCellsQuestionInput = {};
```

## Fields

| Field                                                                                                    | Type                                                                                                     | Required                                                                                                 | Description                                                                                              |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `kind`                                                                                                   | [models.TextqlRpcPublicCellsQuestionInputKind](../models/textql-rpc-public-cells-question-input-kind.md) | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |
| `label`                                                                                                  | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |
| `explanation`                                                                                            | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |
| `sensitive`                                                                                              | *boolean*                                                                                                | :heavy_minus_sign:                                                                                       | formfield inputs: the value is never shown to the agent                                                  |
| `formPathLabel`                                                                                          | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | pretty destination path, for the user to verify                                                          |