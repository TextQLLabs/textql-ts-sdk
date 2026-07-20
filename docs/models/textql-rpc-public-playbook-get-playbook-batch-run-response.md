# TextqlRpcPublicPlaybookGetPlaybookBatchRunResponse

Response containing batch run details

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookGetPlaybookBatchRunResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPlaybookGetPlaybookBatchRunResponse = {
  batchRun: {
    createdAt: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                        | Type                                                                                                         | Required                                                                                                     | Description                                                                                                  |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| `batchRun`                                                                                                   | [models.TextqlRpcPublicPlaybookPlaybookBatchRun](../models/textql-rpc-public-playbook-playbook-batch-run.md) | :heavy_minus_sign:                                                                                           | Batch run record                                                                                             |