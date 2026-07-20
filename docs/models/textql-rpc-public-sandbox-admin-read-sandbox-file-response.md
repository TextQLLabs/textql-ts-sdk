# TextqlRpcPublicSandboxAdminReadSandboxFileResponse

## Example Usage

```typescript
import { TextqlRpcPublicSandboxAdminReadSandboxFileResponse } from "textql-sdk/models";

let value: TextqlRpcPublicSandboxAdminReadSandboxFileResponse = {};
```

## Fields

| Field                                                                    | Type                                                                     | Required                                                                 | Description                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| `available`                                                              | *boolean*                                                                | :heavy_minus_sign:                                                       | False when the sandbox is not running (no live filesystem).              |
| `name`                                                                   | *string*                                                                 | :heavy_minus_sign:                                                       | N/A                                                                      |
| `sizeBytes`                                                              | *models.TextqlRpcPublicSandboxAdminReadSandboxFileResponseSizeBytes*     | :heavy_minus_sign:                                                       | N/A                                                                      |
| `mimeType`                                                               | *string*                                                                 | :heavy_minus_sign:                                                       | N/A                                                                      |
| `content`                                                                | *string*                                                                 | :heavy_minus_sign:                                                       | UTF-8 text content; empty for binary files (see binary_content).         |
| `binaryContent`                                                          | *string*                                                                 | :heavy_minus_sign:                                                       | Raw bytes for binary files (e.g. images); empty for text files.          |
| `truncated`                                                              | *boolean*                                                                | :heavy_minus_sign:                                                       | True when the file exceeded the read cap and content/binary was clipped. |
| `isBinary`                                                               | *boolean*                                                                | :heavy_minus_sign:                                                       | N/A                                                                      |