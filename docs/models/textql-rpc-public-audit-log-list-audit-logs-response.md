# TextqlRpcPublicAuditLogListAuditLogsResponse

## Example Usage

```typescript
import { TextqlRpcPublicAuditLogListAuditLogsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicAuditLogListAuditLogsResponse = {
  entries: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                     | Type                                                                                                      | Required                                                                                                  | Description                                                                                               |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `entries`                                                                                                 | [models.TextqlRpcPublicAuditLogAuditLogEntry](../models/textql-rpc-public-audit-log-audit-log-entry.md)[] | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `nextCursor`                                                                                              | *string*                                                                                                  | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |