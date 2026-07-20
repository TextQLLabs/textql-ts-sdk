# TextqlRpcPublicPatchesListLibrarySyncRunsResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesListLibrarySyncRunsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesListLibrarySyncRunsResponse = {
  runs: [
    {
      startedAt: new Date("2023-01-15T01:30:15.01Z"),
      completedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                    | Type                                                                                                     | Required                                                                                                 | Description                                                                                              |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `runs`                                                                                                   | [models.TextqlRpcPublicPatchesLibrarySyncRun](../models/textql-rpc-public-patches-library-sync-run.md)[] | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |
| `nextPageToken`                                                                                          | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |