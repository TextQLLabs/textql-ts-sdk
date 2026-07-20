# TextqlRpcPublicCellsQuestionAnswer

## Example Usage

```typescript
import { TextqlRpcPublicCellsQuestionAnswer } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsQuestionAnswer = {};
```

## Fields

| Field                                                                                                   | Type                                                                                                    | Required                                                                                                | Description                                                                                             |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `selected`                                                                                              | *string*[]                                                                                              | :heavy_minus_sign:                                                                                      | chosen option names                                                                                     |
| `custom`                                                                                                | *string*                                                                                                | :heavy_minus_sign:                                                                                      | free-text entered for the "Other" option                                                                |
| `inputs`                                                                                                | *string*[]                                                                                              | :heavy_minus_sign:                                                                                      | value per input (sensitive values blanked in the broadcast)                                             |
| `provided`                                                                                              | *boolean*[]                                                                                             | :heavy_minus_sign:                                                                                      | per input: was it filled? lets the summary show provided/empty for sensitive inputs without their value |