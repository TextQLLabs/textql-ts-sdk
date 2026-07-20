# TextqlRpcPublicPlaybookListPlaybookBatchRunsResponse

Response containing list of batch runs

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookListPlaybookBatchRunsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPlaybookListPlaybookBatchRunsResponse = {
  batchRuns: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                          | Type                                                                                                           | Required                                                                                                       | Description                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `batchRuns`                                                                                                    | [models.TextqlRpcPublicPlaybookPlaybookBatchRun](../models/textql-rpc-public-playbook-playbook-batch-run.md)[] | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `totalCount`                                                                                                   | *number*                                                                                                       | :heavy_minus_sign:                                                                                             | Total number of batch runs for this playbook                                                                   |