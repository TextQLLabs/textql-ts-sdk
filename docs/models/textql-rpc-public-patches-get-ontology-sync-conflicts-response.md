# TextqlRpcPublicPatchesGetOntologySyncConflictsResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesGetOntologySyncConflictsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesGetOntologySyncConflictsResponse = {
  conflicts: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                | Type                                                                                                                 | Required                                                                                                             | Description                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `conflicts`                                                                                                          | [models.TextqlRpcPublicPatchesOntologySyncConflict](../models/textql-rpc-public-patches-ontology-sync-conflict.md)[] | :heavy_minus_sign:                                                                                                   | N/A                                                                                                                  |