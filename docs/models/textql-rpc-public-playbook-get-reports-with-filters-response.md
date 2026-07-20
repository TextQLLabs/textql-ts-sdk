# TextqlRpcPublicPlaybookGetReportsWithFiltersResponse

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookGetReportsWithFiltersResponse } from "textql-sdk/models";

let value: TextqlRpcPublicPlaybookGetReportsWithFiltersResponse = {
  reports: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      readAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
  reportsWithHeader: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      readAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                     | Type                                                                                                      | Required                                                                                                  | Description                                                                                               |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `reports`                                                                                                 | [models.TextqlRpcPublicPlaybookPlaybookReport](../models/textql-rpc-public-playbook-playbook-report.md)[] | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `reportsWithHeader`                                                                                       | [models.TextqlRpcPublicPlaybookPlaybookReport](../models/textql-rpc-public-playbook-playbook-report.md)[] | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `totalCount`                                                                                              | *number*                                                                                                  | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `unreadCount`                                                                                             | *number*                                                                                                  | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |