# TextqlRpcPublicPatchesPatchObject

PatchObject is one config object parsed from a patch ref.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesPatchObject } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesPatchObject = {};
```

## Fields

| Field                                                                                                                                              | Type                                                                                                                                               | Required                                                                                                                                           | Description                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `path`                                                                                                                                             | *string*                                                                                                                                           | :heavy_minus_sign:                                                                                                                                 | Library path of the file that defines the object                                                                                                   |
| `name`                                                                                                                                             | *string*                                                                                                                                           | :heavy_minus_sign:                                                                                                                                 | resolved display name                                                                                                                              |
| `type`                                                                                                                                             | *string*                                                                                                                                           | :heavy_minus_sign:                                                                                                                                 | type is the granular object type: "playbook", "dashboard/streamlit",<br/> "dashboard/dash" (the dashboard subtype is load-bearing for previewability). |