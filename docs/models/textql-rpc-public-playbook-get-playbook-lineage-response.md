# TextqlRpcPublicPlaybookGetPlaybookLineageResponse

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookGetPlaybookLineageResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPlaybookGetPlaybookLineageResponse = {
  parent: {
    duplicatedAt: new Date("2023-01-15T01:30:15.01Z"),
  },
  duplicates: [
    {
      duplicatedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                | Type                                                                                                                 | Required                                                                                                             | Description                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `parent`                                                                                                             | [models.TextqlRpcPublicPlaybookPlaybookLineageNode](../models/textql-rpc-public-playbook-playbook-lineage-node.md)   | :heavy_minus_sign:                                                                                                   | N/A                                                                                                                  |
| `duplicates`                                                                                                         | [models.TextqlRpcPublicPlaybookPlaybookLineageNode](../models/textql-rpc-public-playbook-playbook-lineage-node.md)[] | :heavy_minus_sign:                                                                                                   | N/A                                                                                                                  |
| `originPlaybookId`                                                                                                   | *string*                                                                                                             | :heavy_minus_sign:                                                                                                   | N/A                                                                                                                  |