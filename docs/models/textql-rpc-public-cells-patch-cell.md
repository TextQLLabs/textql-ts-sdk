# TextqlRpcPublicCellsPatchCell

EmailRecipient is one resolved recipient of an EmailCell. The frontend
 renders these as chips; the backend uses the resolution to enforce the
 internal-only policy at cell creation time.

## Example Usage

```typescript
import { TextqlRpcPublicCellsPatchCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsPatchCell = {};
```

## Fields

| Field                                                                                           | Type                                                                                            | Required                                                                                        | Description                                                                                     |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `title`                                                                                         | *string*                                                                                        | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `description`                                                                                   | *string*                                                                                        | :heavy_minus_sign:                                                                              | "internal" or "external"                                                                        |
| `number`                                                                                        | *number*                                                                                        | :heavy_minus_sign:                                                                              | populated when class == "internal"                                                              |
| `hasConflicts`                                                                                  | *boolean*                                                                                       | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `conflictView`                                                                                  | *string*                                                                                        | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `status`                                                                                        | [models.TextqlRpcPublicPatchesPatchStatus](../models/textql-rpc-public-patches-patch-status.md) | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `diffs`                                                                                         | [models.TextqlRpcPublicPatchesPatchDiff](../models/textql-rpc-public-patches-patch-diff.md)[]   | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `patchId`                                                                                       | *string*                                                                                        | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `gitRef`                                                                                        | *string*                                                                                        | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `autoApproved`                                                                                  | *boolean*                                                                                       | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `autoApprovedRuleDirectory`                                                                     | *string*                                                                                        | :heavy_minus_sign:                                                                              | N/A                                                                                             |