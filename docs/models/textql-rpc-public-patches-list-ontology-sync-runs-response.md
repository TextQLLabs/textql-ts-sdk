# TextqlRpcPublicPatchesListOntologySyncRunsResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesListOntologySyncRunsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesListOntologySyncRunsResponse = {
  runs: [
    {
      startedAt: new Date("2023-01-15T01:30:15.01Z"),
      completedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                      | Type                                                                                                       | Required                                                                                                   | Description                                                                                                |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `runs`                                                                                                     | [models.TextqlRpcPublicPatchesOntologySyncRun](../models/textql-rpc-public-patches-ontology-sync-run.md)[] | :heavy_minus_sign:                                                                                         | N/A                                                                                                        |
| `nextPageToken`                                                                                            | *string*                                                                                                   | :heavy_minus_sign:                                                                                         | N/A                                                                                                        |