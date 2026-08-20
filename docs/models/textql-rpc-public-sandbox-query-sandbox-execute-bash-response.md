# TextqlRpcPublicSandboxQuerySandboxExecuteBashResponse

## Example Usage

```typescript
import { TextqlRpcPublicSandboxQuerySandboxExecuteBashResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicSandboxQuerySandboxExecuteBashResponse = {};
```

## Fields

| Field                                                       | Type                                                        | Required                                                    | Description                                                 |
| ----------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------- |
| `stdout`                                                    | *string*                                                    | :heavy_minus_sign:                                          | N/A                                                         |
| `stderr`                                                    | *string*                                                    | :heavy_minus_sign:                                          | N/A                                                         |
| `exitCode`                                                  | *number*                                                    | :heavy_minus_sign:                                          | N/A                                                         |
| `error`                                                     | *string*                                                    | :heavy_minus_sign:                                          | non-empty on execution-level failure (timeout, spawn error) |
| `refreshedToken`                                            | *string*                                                    | :heavy_minus_sign:                                          | N/A                                                         |