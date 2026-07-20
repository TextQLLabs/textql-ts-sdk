# TextqlRpcPublicSandboxAdminSandboxDataframe

Note: spelled "Dataframe" (not "DataFrame") to avoid a Go type collision
 with dataset.proto's SandboxDataFrame — both files generate into the same
 Go package (compute/pkg/rpc/server/public).

## Example Usage

```typescript
import { TextqlRpcPublicSandboxAdminSandboxDataframe } from "@textql/sdk/models";

let value: TextqlRpcPublicSandboxAdminSandboxDataframe = {};
```

## Fields

| Field                                                                | Type                                                                 | Required                                                             | Description                                                          |
| -------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `name`                                                               | *string*                                                             | :heavy_minus_sign:                                                   | N/A                                                                  |
| `numRows`                                                            | *models.TextqlRpcPublicSandboxAdminSandboxDataframeNumRows*          | :heavy_minus_sign:                                                   | N/A                                                                  |
| `numCols`                                                            | *models.TextqlRpcPublicSandboxAdminSandboxDataframeNumCols*          | :heavy_minus_sign:                                                   | N/A                                                                  |
| `memoryUsageBytes`                                                   | *models.TextqlRpcPublicSandboxAdminSandboxDataframeMemoryUsageBytes* | :heavy_minus_sign:                                                   | N/A                                                                  |