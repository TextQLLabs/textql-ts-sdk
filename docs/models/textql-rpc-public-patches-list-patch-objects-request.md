# TextqlRpcPublicPatchesListPatchObjectsRequest

ListPatchObjectsRequest inspects the config objects at a patch's git ref.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesListPatchObjectsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesListPatchObjectsRequest = {};
```

## Fields

| Field                           | Type                            | Required                        | Description                     |
| ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- |
| `patchRef`                      | *string*                        | :heavy_minus_sign:              | git ref of the patch to inspect |