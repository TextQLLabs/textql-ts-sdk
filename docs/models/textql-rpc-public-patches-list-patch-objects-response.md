# TextqlRpcPublicPatchesListPatchObjectsResponse

ListPatchObjectsRequest inspects the config objects at a patch's git ref.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesListPatchObjectsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesListPatchObjectsResponse = {};
```

## Fields

| Field                                                                                             | Type                                                                                              | Required                                                                                          | Description                                                                                       |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `objects`                                                                                         | [models.TextqlRpcPublicPatchesPatchObject](../models/textql-rpc-public-patches-patch-object.md)[] | :heavy_minus_sign:                                                                                | git ref of the patch to inspect                                                                   |