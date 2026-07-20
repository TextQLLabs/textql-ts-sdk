# TextqlRpcPublicAppInvokeAppComputeFunctionResponse

ComputeFunction is a declared server-side function invocable from the app via the bridge.
 Exactly one of code (python, runs on the app's worker), sql (plain SQL on the app's
 private DB), tql (inline TQL source), or tql_path (a Context Library .tql) must be set.
 TQL variants are real TQL (compiled at save time) executed against a connector; sql is
 the app-state path (:name params bound server-side, reserved :_now / :_uuid).

## Example Usage

```typescript
import { TextqlRpcPublicAppInvokeAppComputeFunctionResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicAppInvokeAppComputeFunctionResponse = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `resultJson`       | *string*           | :heavy_minus_sign: | N/A                |