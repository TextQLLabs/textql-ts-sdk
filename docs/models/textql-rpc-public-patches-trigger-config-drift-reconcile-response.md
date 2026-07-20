# TextqlRpcPublicPatchesTriggerConfigDriftReconcileResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesTriggerConfigDriftReconcileResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesTriggerConfigDriftReconcileResponse = {};
```

## Fields

| Field                                                                                                                                                  | Type                                                                                                                                                   | Required                                                                                                                                               | Description                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `drifted`                                                                                                                                              | *boolean*                                                                                                                                              | :heavy_minus_sign:                                                                                                                                     | True ⇒ the org's live Library HEAD differed from the last reconciled commit,<br/> so a catch-up reconcile was enqueued. False ⇒ already converged (no-op). |