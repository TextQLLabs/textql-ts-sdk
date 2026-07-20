# TextqlRpcPublicPlaybookGetPlaybookReportsBatchResponse

Batch response with reports grouped by template_data_id

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookGetPlaybookReportsBatchResponse } from "textql-sdk/models";

let value: TextqlRpcPublicPlaybookGetPlaybookReportsBatchResponse = {
  templateDataReports: [
    {
      reports: [
        {
          createdAt: new Date("2023-01-15T01:30:15.01Z"),
          readAt: new Date("2023-01-15T01:30:15.01Z"),
        },
      ],
    },
  ],
};
```

## Fields

| Field                                                                                                                | Type                                                                                                                 | Required                                                                                                             | Description                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `templateDataReports`                                                                                                | [models.TextqlRpcPublicPlaybookTemplateDataReports](../models/textql-rpc-public-playbook-template-data-reports.md)[] | :heavy_minus_sign:                                                                                                   | N/A                                                                                                                  |