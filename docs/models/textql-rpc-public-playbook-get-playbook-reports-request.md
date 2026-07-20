# TextqlRpcPublicPlaybookGetPlaybookReportsRequest

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookGetPlaybookReportsRequest } from "textql-sdk/models";

let value: TextqlRpcPublicPlaybookGetPlaybookReportsRequest = {};
```

## Fields

| Field                              | Type                               | Required                           | Description                        |
| ---------------------------------- | ---------------------------------- | ---------------------------------- | ---------------------------------- |
| `playbookId`                       | *string*                           | :heavy_minus_sign:                 | UUID                               |
| `limit`                            | *number*                           | :heavy_minus_sign:                 | N/A                                |
| `offset`                           | *number*                           | :heavy_minus_sign:                 | N/A                                |
| `chatId`                           | *string*                           | :heavy_minus_sign:                 | UUID                               |
| `templateDataId`                   | *string*                           | :heavy_minus_sign:                 | UUID                               |
| `batchRunId`                       | *string*                           | :heavy_minus_sign:                 | UUID - filter reports by batch run |