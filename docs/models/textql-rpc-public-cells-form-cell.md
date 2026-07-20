# TextqlRpcPublicCellsFormCell

FormCell is the v2 form editor cell. It only references a form_v5 row by id;
 the frontend loads the full form via FormService (no chat-cell scanning). The
 cached fields let the inline chat cell render without a round-trip.

## Example Usage

```typescript
import { TextqlRpcPublicCellsFormCell } from "textql-sdk/models";

let value: TextqlRpcPublicCellsFormCell = {};
```

## Fields

| Field                                                                                              | Type                                                                                               | Required                                                                                           | Description                                                                                        |
| -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `action`                                                                                           | *string*                                                                                           | :heavy_minus_sign:                                                                                 | list \| info \| create \| edit \| view \| update \| test                                           |
| `formId`                                                                                           | *string*                                                                                           | :heavy_minus_sign:                                                                                 | N/A                                                                                                |
| `formType`                                                                                         | *string*                                                                                           | :heavy_minus_sign:                                                                                 | cached for inline display (e.g. "connector")                                                       |
| `status`                                                                                           | *string*                                                                                           | :heavy_minus_sign:                                                                                 | cached submission status (draft\|submitting\|submitted\|rejected)                                  |
| `testStatus`                                                                                       | *string*                                                                                           | :heavy_minus_sign:                                                                                 | cached test status (not_run\|running\|passed\|failed)                                              |
| `name`                                                                                             | *string*                                                                                           | :heavy_minus_sign:                                                                                 | N/A                                                                                                |
| `approvalOutcome`                                                                                  | *string*                                                                                           | :heavy_minus_sign:                                                                                 | ask_approval outcome once the user acts: submitted \| submit_failed \| rejected \| changes_requested. |
| `testMessage`                                                                                      | *string*                                                                                           | :heavy_minus_sign:                                                                                 | this test's result message (shown by the test row)                                                 |