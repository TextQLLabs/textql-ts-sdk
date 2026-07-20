# TextqlRpcPublicSandboxAdminListSandboxFilesResponse

## Example Usage

```typescript
import { TextqlRpcPublicSandboxAdminListSandboxFilesResponse } from "textql-sdk/models";

let value: TextqlRpcPublicSandboxAdminListSandboxFilesResponse = {
  entries: [
    {
      modifiedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                   | Type                                                                                                                    | Required                                                                                                                | Description                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `available`                                                                                                             | *boolean*                                                                                                               | :heavy_minus_sign:                                                                                                      | False when the sandbox is not running (no live filesystem); entries empty.                                              |
| `entries`                                                                                                               | [models.TextqlRpcPublicSandboxAdminSandboxFileEntry](../models/textql-rpc-public-sandbox-admin-sandbox-file-entry.md)[] | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |