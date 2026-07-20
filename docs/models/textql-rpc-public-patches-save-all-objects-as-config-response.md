# TextqlRpcPublicPatchesSaveAllObjectsAsConfigResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesSaveAllObjectsAsConfigResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesSaveAllObjectsAsConfigResponse = {
  patch: {
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                              | Type                                                                                                               | Required                                                                                                           | Description                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `patch`                                                                                                            | [models.TextqlRpcPublicPatchesPatch](../models/textql-rpc-public-patches-patch.md)                                 | :heavy_minus_sign:                                                                                                 | N/A                                                                                                                |
| `filePaths`                                                                                                        | *string*[]                                                                                                         | :heavy_minus_sign:                                                                                                 | Library-relative paths of the config files in the patch.                                                           |
| `skipped`                                                                                                          | [models.TextqlRpcPublicPatchesSkippedConfigExport](../models/textql-rpc-public-patches-skipped-config-export.md)[] | :heavy_minus_sign:                                                                                                 | N/A                                                                                                                |
| `alreadyManagedCount`                                                                                              | *number*                                                                                                           | :heavy_minus_sign:                                                                                                 | Objects excluded up front because a config file already manages them.                                              |