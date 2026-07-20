# TextqlRpcPublicPatchesListLibraryHistoryResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesListLibraryHistoryResponse } from "textql-sdk/models";

let value: TextqlRpcPublicPatchesListLibraryHistoryResponse = {
  history: [
    {
      committedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                              | Type                                                                                                               | Required                                                                                                           | Description                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `history`                                                                                                          | [models.TextqlRpcPublicPatchesLibraryHistoryEntry](../models/textql-rpc-public-patches-library-history-entry.md)[] | :heavy_minus_sign:                                                                                                 | N/A                                                                                                                |
| `nextPageToken`                                                                                                    | *string*                                                                                                           | :heavy_minus_sign:                                                                                                 | N/A                                                                                                                |