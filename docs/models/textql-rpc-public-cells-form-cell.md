# TextqlRpcPublicCellsFormCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsFormCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsFormCell = {};
```

## Fields

| Field                                  | Type                                   | Required                               | Description                            |
| -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- |
| `action`                               | *string*                               | :heavy_minus_sign:                     | input "inspect" \| "render" \| "execute" |
| `formId`                               | *string*                               | :heavy_minus_sign:                     | N/A                                    |
| `formType`                             | *string*                               | :heavy_minus_sign:                     | JSON-encoded map of param name → value |
| `status`                               | *string*                               | :heavy_minus_sign:                     | N/A                                    |
| `testStatus`                           | *string*                               | :heavy_minus_sign:                     | result                                 |
| `name`                                 | *string*                               | :heavy_minus_sign:                     | N/A                                    |
| `approvalOutcome`                      | *string*                               | :heavy_minus_sign:                     | N/A                                    |
| `testMessage`                          | *string*                               | :heavy_minus_sign:                     | N/A                                    |