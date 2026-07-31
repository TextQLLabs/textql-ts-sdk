# TextqlRpcPublicPatchesValidateConfigResponse

ValidateConfigRequest validates a filed patch's ref. The proposed sandbox
 working-tree source is served by the Ana chat-cell tool, not this RPC.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesValidateConfigResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesValidateConfigResponse = {};
```

## Fields

| Field                                                                                                       | Type                                                                                                        | Required                                                                                                    | Description                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `ok`                                                                                                        | *boolean*                                                                                                   | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |
| `diagnostics`                                                                                               | [models.TextqlRpcPublicPatchesConfigDiagnostic](../models/textql-rpc-public-patches-config-diagnostic.md)[] | :heavy_minus_sign:                                                                                          | N/A                                                                                                         |