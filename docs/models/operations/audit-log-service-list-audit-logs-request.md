# AuditLogServiceListAuditLogsRequest

## Example Usage

```typescript
import { AuditLogServiceListAuditLogsRequest } from "textql-sdk/models/operations";

let value: AuditLogServiceListAuditLogsRequest = {
  connectProtocolVersion: 1,
  body: {
    after: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                                     | Type                                                                                                                      | Required                                                                                                                  | Description                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                  | *1*                                                                                                                       | :heavy_check_mark:                                                                                                        | N/A                                                                                                                       |
| `connectTimeoutMs`                                                                                                        | *number*                                                                                                                  | :heavy_minus_sign:                                                                                                        | N/A                                                                                                                       |
| `body`                                                                                                                    | [models.TextqlRpcPublicAuditLogListAuditLogsRequest](../../models/textql-rpc-public-audit-log-list-audit-logs-request.md) | :heavy_check_mark:                                                                                                        | N/A                                                                                                                       |