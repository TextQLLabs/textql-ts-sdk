# TextqlRpcPublicPatchesConfigDiagnostic

## Example Usage

```typescript
import { TextqlRpcPublicPatchesConfigDiagnostic } from "textql-sdk/models";

let value: TextqlRpcPublicPatchesConfigDiagnostic = {};
```

## Fields

| Field                                                                                                                | Type                                                                                                                 | Required                                                                                                             | Description                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `path`                                                                                                               | *string*                                                                                                             | :heavy_minus_sign:                                                                                                   | path is the config file the finding is attributed to.                                                                |
| `message`                                                                                                            | *string*                                                                                                             | :heavy_minus_sign:                                                                                                   | N/A                                                                                                                  |
| `class`                                                                                                              | [models.TextqlRpcPublicPatchesConfigDiagnosticClass](../models/textql-rpc-public-patches-config-diagnostic-class.md) | :heavy_minus_sign:                                                                                                   | ConfigDiagnosticClass partitions a finding by who can fix it, so an authoring loop<br/> knows whether to keep iterating. |