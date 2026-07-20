# TextqlRpcPublicPatchesSaveAllObjectsAsConfigRequest

SaveAllObjectsAsConfig is the bulk SaveObjectAsConfig: it renders every
 object of the type the caller can read (and that has no config history) into
 ONE open patch. Objects the config format cannot express are skipped with a
 per-object reason rather than failing the batch.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesSaveAllObjectsAsConfigRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesSaveAllObjectsAsConfigRequest = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `objectType`       | *string*           | :heavy_minus_sign: | N/A                |