# TextqlRpcPublicPatchesFinalizeOntologyFileUploadResponse

Counts of the entries a caller may see beneath a subtree. Excludes the subtree
 root itself and reserved names (OWNERS, .gitignore, .DS_Store, .tmp-*), which
 are bookkeeping rather than Ontology content.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesFinalizeOntologyFileUploadResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesFinalizeOntologyFileUploadResponse = {
  file: {
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                             | Type                                                                                              | Required                                                                                          | Description                                                                                       |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `file`                                                                                            | [models.TextqlRpcPublicPatchesOntologyFile](../models/textql-rpc-public-patches-ontology-file.md) | :heavy_minus_sign:                                                                                | N/A                                                                                               |