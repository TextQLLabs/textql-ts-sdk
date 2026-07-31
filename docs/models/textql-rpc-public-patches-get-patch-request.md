# TextqlRpcPublicPatchesGetPatchRequest

GetConfigExportCapabilities tells the UI whether to offer "Save as config":
 which object types currently have a working exporter (registered AND its
 dependencies — e.g. the ontology parser — reachable), and whether the caller
 holds the permission SaveObjectAsConfig requires. Authn-only: the response
 carries the authorization answer instead of failing the call.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesGetPatchRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesGetPatchRequest = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `patchId`          | *string*           | :heavy_minus_sign: | N/A                |
| `revision`         | *number*           | :heavy_minus_sign: | N/A                |