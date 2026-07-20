# TextqlRpcPublicSandboxAdminReadSandboxFileResponse

One CPU/memory measurement of a sandbox worker.

## Example Usage

```typescript
import { TextqlRpcPublicSandboxAdminReadSandboxFileResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicSandboxAdminReadSandboxFileResponse = {};
```

## Fields

| Field                                                                    | Type                                                                     | Required                                                                 | Description                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `available`                                                              | *boolean*                                                                | :heavy_minus_sign:                                                       | N/A                                                                      |
| `name`                                                                   | *string*                                                                 | :heavy_minus_sign:                                                       | CPU in cores (e.g. 0.12 used of a 1.5 limit). Limit 0 = none configured. |
| `sizeBytes`                                                              | *models.TextqlRpcPublicSandboxAdminReadSandboxFileResponseSizeBytes*     | :heavy_minus_sign:                                                       | N/A                                                                      |
| `mimeType`                                                               | *string*                                                                 | :heavy_minus_sign:                                                       | Percent of the limit in [0, 100]; 0 when no limit is configured.         |
| `content`                                                                | *string*                                                                 | :heavy_minus_sign:                                                       | N/A                                                                      |
| `binaryContent`                                                          | *string*                                                                 | :heavy_minus_sign:                                                       | N/A                                                                      |
| `truncated`                                                              | *boolean*                                                                | :heavy_minus_sign:                                                       | N/A                                                                      |
| `isBinary`                                                               | *boolean*                                                                | :heavy_minus_sign:                                                       | N/A                                                                      |