# TextqlRpcPublicPatchesConfigDiagnosticClass

ConfigDiagnosticClass partitions a finding by who can fix it, so an authoring loop
 knows whether to keep iterating.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesConfigDiagnosticClass } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesConfigDiagnosticClass =
  "CONFIG_DIAGNOSTIC_CLASS_EDIT_FIXABLE";

// Open enum: unrecognized values are captured as Unrecognized<string>
```

## Values

```typescript
"CONFIG_DIAGNOSTIC_CLASS_UNSPECIFIED" | "CONFIG_DIAGNOSTIC_CLASS_EDIT_FIXABLE" | "CONFIG_DIAGNOSTIC_CLASS_ORG_STATE_FIXABLE" | Unrecognized<string>
```