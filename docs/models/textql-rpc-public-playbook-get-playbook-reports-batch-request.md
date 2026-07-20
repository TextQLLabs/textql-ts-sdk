# TextqlRpcPublicPlaybookGetPlaybookReportsBatchRequest

Batch request to get reports for multiple template data IDs efficiently

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookGetPlaybookReportsBatchRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicPlaybookGetPlaybookReportsBatchRequest = {};
```

## Fields

| Field                                                     | Type                                                      | Required                                                  | Description                                               |
| --------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `playbookId`                                              | *string*                                                  | :heavy_minus_sign:                                        | UUID                                                      |
| `templateDataIds`                                         | *string*[]                                                | :heavy_minus_sign:                                        | List of template data UUIDs to fetch reports for          |
| `limitPerTemplate`                                        | *number*                                                  | :heavy_minus_sign:                                        | Max reports to return per template_data_id (default: 100) |
| `batchRunId`                                              | *string*                                                  | :heavy_minus_sign:                                        | UUID - filter reports and artifacts by batch run          |