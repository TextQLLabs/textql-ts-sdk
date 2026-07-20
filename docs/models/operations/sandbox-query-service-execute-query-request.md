# SandboxQueryServiceExecuteQueryRequest

## Example Usage

```typescript
import { SandboxQueryServiceExecuteQueryRequest } from "textql-sdk/models/operations";

let value: SandboxQueryServiceExecuteQueryRequest = {
  body: {
    sqlQuery: {},
  },
};
```

## Fields

| Field                                                          | Type                                                           | Required                                                       | Description                                                    |
| -------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| `connectProtocolVersion`                                       | *1*                                                            | :heavy_check_mark:                                             | N/A                                                            |
| `connectTimeoutMs`                                             | *number*                                                       | :heavy_minus_sign:                                             | N/A                                                            |
| `body`                                                         | *models.TextqlRpcPublicSandboxQuerySandboxExecuteQueryRequest* | :heavy_check_mark:                                             | N/A                                                            |