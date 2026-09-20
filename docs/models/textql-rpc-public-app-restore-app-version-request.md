# TextqlRpcPublicAppRestoreAppVersionRequest

## Example Usage

```typescript
import { TextqlRpcPublicAppRestoreAppVersionRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppRestoreAppVersionRequest = {};
```

## Fields

| Field                                                                                    | Type                                                                                     | Required                                                                                 | Description                                                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `appId`                                                                                  | *string*                                                                                 | :heavy_minus_sign:                                                                       | N/A                                                                                      |
| `versionNumber`                                                                          | *number*                                                                                 | :heavy_minus_sign:                                                                       | N/A                                                                                      |
| `commitId`                                                                               | *string*                                                                                 | :heavy_minus_sign:                                                                       | Prefer this git commit SHA when set; else version_number selects a legacy db-backed row. |