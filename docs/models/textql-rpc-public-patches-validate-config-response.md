# TextqlRpcPublicPatchesValidateConfigResponse

ValidateConfigResponse: ok == true with no diagnostics means functionally valid
 against current org state — not a merge guarantee.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesValidateConfigResponse } from "textql-sdk/models";

let value: TextqlRpcPublicPatchesValidateConfigResponse = {};
```

## Fields

| Field                                                                                                       | Type                                                                                                        | Required                                                                                                    | Description                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ok`                                                                                                        | *boolean*                                                                                                   | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |
| `diagnostics`                                                                                               | [models.TextqlRpcPublicPatchesConfigDiagnostic](../models/textql-rpc-public-patches-config-diagnostic.md)[] | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |