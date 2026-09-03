# TextqlRpcPublicPatchesFinalizeOntologyFileUploadRequest

Counts of the entries a caller may see beneath a subtree. Excludes the subtree
 root itself and reserved names (OWNERS, .gitignore, .DS_Store, .tmp-*), which
 are bookkeeping rather than Ontology content.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesFinalizeOntologyFileUploadRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesFinalizeOntologyFileUploadRequest = {};
```

## Fields

| Field                                                                                                                                          | Type                                                                                                                                           | Required                                                                                                                                       | Description                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`                                                                                                                                         | *string*                                                                                                                                       | :heavy_minus_sign:                                                                                                                             | N/A                                                                                                                                            |
| `uploadKey`                                                                                                                                    | *string*                                                                                                                                       | :heavy_minus_sign:                                                                                                                             | N/A                                                                                                                                            |
| `commitMessage`                                                                                                                                | *string*                                                                                                                                       | :heavy_minus_sign:                                                                                                                             | Last frame for this walk. Earlier frames are partial counts; the final<br/> frame always carries the complete total — the walk is never truncated. |