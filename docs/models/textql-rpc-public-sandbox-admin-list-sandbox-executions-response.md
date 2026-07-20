# TextqlRpcPublicSandboxAdminListSandboxExecutionsResponse

## Example Usage

```typescript
import { TextqlRpcPublicSandboxAdminListSandboxExecutionsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicSandboxAdminListSandboxExecutionsResponse = {
  executions: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                  | Type                                                                                                                   | Required                                                                                                               | Description                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `executions`                                                                                                           | [models.TextqlRpcPublicSandboxAdminSandboxExecution](../models/textql-rpc-public-sandbox-admin-sandbox-execution.md)[] | :heavy_minus_sign:                                                                                                     | N/A                                                                                                                    |
| `nextCursor`                                                                                                           | *string*                                                                                                               | :heavy_minus_sign:                                                                                                     | N/A                                                                                                                    |