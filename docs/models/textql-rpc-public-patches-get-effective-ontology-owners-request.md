# TextqlRpcPublicPatchesGetEffectiveOntologyOwnersRequest

Returns the *effective* owners for a directory after walking ancestor
 OWNERS files: for every role in the org, the resolved permission the
 role would have on this directory (per `permissionForDirWithRoles`).
 Use this when you need to compare permissions across paths — the
 literal GetOntologyOwners only reflects the OWNERS file at the exact
 path, missing inheritance.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesGetEffectiveOntologyOwnersRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesGetEffectiveOntologyOwnersRequest = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `path`             | *string*           | :heavy_minus_sign: | N/A                |