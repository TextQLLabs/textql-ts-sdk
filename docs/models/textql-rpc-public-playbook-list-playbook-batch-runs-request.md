# TextqlRpcPublicPlaybookListPlaybookBatchRunsRequest

Request to list batch runs for a playbook

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookListPlaybookBatchRunsRequest } from "textql-sdk/models";

let value: TextqlRpcPublicPlaybookListPlaybookBatchRunsRequest = {};
```

## Fields

| Field                               | Type                                | Required                            | Description                         |
| ----------------------------------- | ----------------------------------- | ----------------------------------- | ----------------------------------- |
| `playbookId`                        | *string*                            | :heavy_minus_sign:                  | UUID                                |
| `limit`                             | *number*                            | :heavy_minus_sign:                  | Max number of results (default: 50) |
| `offset`                            | *number*                            | :heavy_minus_sign:                  | Offset for pagination (default: 0)  |