# TextqlRpcPublicPatchesOntologySizeDay

OntologySizeDay is the ontology's total content size as of the end of one UTC
 day, sampled from git history (the last commit on or before that day).

## Example Usage

```typescript
import { TextqlRpcPublicPatchesOntologySizeDay } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesOntologySizeDay = {};
```

## Fields

| Field                                                                            | Type                                                                             | Required                                                                         | Description                                                                      |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `date`                                                                           | [models.TextqlRpcPublicPatchesDate](../models/textql-rpc-public-patches-date.md) | :heavy_minus_sign:                                                               | copied from google.type.Date; not available in buf's google/protobuf/*           |
| `totalBytes`                                                                     | *models.TotalBytes*                                                              | :heavy_minus_sign:                                                               | N/A                                                                              |
| `fileCount`                                                                      | *number*                                                                         | :heavy_minus_sign:                                                               | N/A                                                                              |