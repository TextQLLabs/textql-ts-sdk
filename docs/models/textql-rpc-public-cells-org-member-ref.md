# TextqlRpcPublicCellsOrgMemberRef

FormCell is the v2 form editor cell. It only references a form_v5 row by id;
 the frontend loads the full form via FormService (no chat-cell scanning). The
 cached fields let the inline chat cell render without a round-trip.

## Example Usage

```typescript
import { TextqlRpcPublicCellsOrgMemberRef } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsOrgMemberRef = {};
```

## Fields

| Field                                              | Type                                               | Required                                           | Description                                        |
| -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| `email`                                            | *string*                                           | :heavy_minus_sign:                                 | list \| info \| create \| edit \| view \| update \| test |
| `name`                                             | *string*                                           | :heavy_minus_sign:                                 | N/A                                                |