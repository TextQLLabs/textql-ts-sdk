# TextqlRpcPublicPatchesSaveObjectAsConfigResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesSaveObjectAsConfigResponse } from "textql-sdk/models";

let value: TextqlRpcPublicPatchesSaveObjectAsConfigResponse = {
  patch: {
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                              | Type                                                                               | Required                                                                           | Description                                                                        |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `patch`                                                                            | [models.TextqlRpcPublicPatchesPatch](../models/textql-rpc-public-patches-patch.md) | :heavy_minus_sign:                                                                 | N/A                                                                                |
| `filePath`                                                                         | *string*                                                                           | :heavy_minus_sign:                                                                 | Library-relative path the config file was placed at.                               |