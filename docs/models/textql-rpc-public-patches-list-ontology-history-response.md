# TextqlRpcPublicPatchesListOntologyHistoryResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesListOntologyHistoryResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesListOntologyHistoryResponse = {
  history: [
    {
      committedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                | Type                                                                                                                 | Required                                                                                                             | Description                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `history`                                                                                                            | [models.TextqlRpcPublicPatchesOntologyHistoryEntry](../models/textql-rpc-public-patches-ontology-history-entry.md)[] | :heavy_minus_sign:                                                                                                   | N/A                                                                                                                  |
| `nextPageToken`                                                                                                      | *string*                                                                                                             | :heavy_minus_sign:                                                                                                   | N/A                                                                                                                  |