# TextqlRpcPublicPatchesSaveObjectAsConfigRequest

SaveObjectAsConfig renders an existing DB object (object_type keyed like
 config_source: "playbook", later "dashboard", ...) as a config file and
 authors it as a new OPEN patch under the type's default library folder. The
 file can be moved/edited like any patch file before merging; on merge,
 reconcile takes over the original object when content and permissions allow.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesSaveObjectAsConfigRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesSaveObjectAsConfigRequest = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `objectType`       | *string*           | :heavy_minus_sign: | N/A                |
| `objectId`         | *string*           | :heavy_minus_sign: | N/A                |