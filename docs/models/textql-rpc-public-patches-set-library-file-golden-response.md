# TextqlRpcPublicPatchesSetLibraryFileGoldenResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesSetLibraryFileGoldenResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesSetLibraryFileGoldenResponse = {
  golden: [
    {
      setAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                             | Type                                                                                              | Required                                                                                          | Description                                                                                       |
| ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `golden`                                                                                          | [models.TextqlRpcPublicPatchesGoldenEntry](../models/textql-rpc-public-patches-golden-entry.md)[] | :heavy_minus_sign:                                                                                | full active list after the change                                                                 |