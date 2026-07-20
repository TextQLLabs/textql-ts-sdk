# TextqlRpcPublicSandboxAdminGetSandboxResponse

## Example Usage

```typescript
import { TextqlRpcPublicSandboxAdminGetSandboxResponse } from "textql-sdk/models";

let value: TextqlRpcPublicSandboxAdminGetSandboxResponse = {
  sandbox: {
    startedAt: new Date("2023-01-15T01:30:15.01Z"),
    releasedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                                  | Type                                                                                                                   | Required                                                                                                               | Description                                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `sandbox`                                                                                                              | [models.TextqlRpcPublicSandboxAdminSandboxSummary](../models/textql-rpc-public-sandbox-admin-sandbox-summary.md)       | :heavy_minus_sign:                                                                                                     | N/A                                                                                                                    |
| `liveAvailable`                                                                                                        | *boolean*                                                                                                              | :heavy_minus_sign:                                                                                                     | N/A                                                                                                                    |
| `memoryUsageBytes`                                                                                                     | *models.TextqlRpcPublicSandboxAdminGetSandboxResponseMemoryUsageBytes*                                                 | :heavy_minus_sign:                                                                                                     | N/A                                                                                                                    |
| `dataframes`                                                                                                           | [models.TextqlRpcPublicSandboxAdminSandboxDataframe](../models/textql-rpc-public-sandbox-admin-sandbox-dataframe.md)[] | :heavy_minus_sign:                                                                                                     | N/A                                                                                                                    |