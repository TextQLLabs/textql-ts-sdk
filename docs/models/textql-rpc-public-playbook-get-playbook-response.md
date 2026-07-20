# TextqlRpcPublicPlaybookGetPlaybookResponse

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookGetPlaybookResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPlaybookGetPlaybookResponse = {
  playbook: {
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
    updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    duplicatedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
  reports: [
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
| `playbook`                                                                                                | [models.TextqlRpcPublicPlaybookPlaybook](../models/textql-rpc-public-playbook-playbook.md)                | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `reports`                                                                                                 | [models.TextqlRpcPublicPlaybookPlaybookReport](../models/textql-rpc-public-playbook-playbook-report.md)[] | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `totalReportsCount`                                                                                       | *number*                                                                                                  | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |