# TextqlRpcPublicSandboxAdminListSandboxSpendResponse

## Example Usage

```typescript
import { TextqlRpcPublicSandboxAdminListSandboxSpendResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicSandboxAdminListSandboxSpendResponse = {
  intervals: [
    {
      startedAt: new Date("2023-01-15T01:30:15.01Z"),
      endedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                           | Type                                                                                                                            | Required                                                                                                                        | Description                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `intervals`                                                                                                                     | [models.TextqlRpcPublicSandboxAdminSandboxSpendInterval](../models/textql-rpc-public-sandbox-admin-sandbox-spend-interval.md)[] | :heavy_minus_sign:                                                                                                              | Newest first.                                                                                                                   |
| `acusPerHour`                                                                                                                   | *number*                                                                                                                        | :heavy_minus_sign:                                                                                                              | ACUs per instance-hour used to compute the figures above.                                                                       |
| `totalAcus`                                                                                                                     | *number*                                                                                                                        | :heavy_minus_sign:                                                                                                              | Sum of acus across all returned intervals.                                                                                      |