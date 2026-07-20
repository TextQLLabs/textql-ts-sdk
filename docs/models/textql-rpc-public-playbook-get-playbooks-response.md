# TextqlRpcPublicPlaybookGetPlaybooksResponse

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookGetPlaybooksResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPlaybookGetPlaybooksResponse = {
  playbooks: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      duplicatedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                        | Type                                                                                         | Required                                                                                     | Description                                                                                  |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `playbooks`                                                                                  | [models.TextqlRpcPublicPlaybookPlaybook](../models/textql-rpc-public-playbook-playbook.md)[] | :heavy_minus_sign:                                                                           | N/A                                                                                          |
| `totalCount`                                                                                 | *number*                                                                                     | :heavy_minus_sign:                                                                           | N/A                                                                                          |