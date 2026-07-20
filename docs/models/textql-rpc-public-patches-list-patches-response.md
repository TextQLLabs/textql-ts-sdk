# TextqlRpcPublicPatchesListPatchesResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesListPatchesResponse } from "textql-sdk/models";

let value: TextqlRpcPublicPatchesListPatchesResponse = {
  patches: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                        | Type                                                                                                         | Required                                                                                                     | Description                                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `patches`                                                                                                    | [models.TextqlRpcPublicPatchesPatch](../models/textql-rpc-public-patches-patch.md)[]                         | :heavy_minus_sign:                                                                                           | N/A                                                                                                          |
| `nextPageToken`                                                                                              | *string*                                                                                                     | :heavy_minus_sign:                                                                                           | N/A                                                                                                          |
| `counts`                                                                                                     | [models.TextqlRpcPublicPatchesPatchStatusCounts](../models/textql-rpc-public-patches-patch-status-counts.md) | :heavy_minus_sign:                                                                                           | N/A                                                                                                          |