# TextqlRpcPublicPatchesSetOntologyOwnersResponse

Returns the *effective* owners for a directory after walking ancestor
 OWNERS files: for every role in the org, the resolved permission the
 role would have on this directory (per `permissionForDirWithRoles`).
 Use this when you need to compare permissions across paths — the
 literal GetOntologyOwners only reflects the OWNERS file at the exact
 path, missing inheritance.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesSetOntologyOwnersResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesSetOntologyOwnersResponse = {
  owners: {
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                 | Type                                                                                                  | Required                                                                                              | Description                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `owners`                                                                                              | [models.TextqlRpcPublicPatchesOntologyOwners](../models/textql-rpc-public-patches-ontology-owners.md) | :heavy_minus_sign:                                                                                    | N/A                                                                                                   |