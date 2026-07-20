# TextqlRpcPublicPlaybookTemplateDataReports

Grouped reports by template_data_id

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookTemplateDataReports } from "@textql/sdk/models";

let value: TextqlRpcPublicPlaybookTemplateDataReports = {
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
| `templateDataId`                                                                                          | *string*                                                                                                  | :heavy_minus_sign:                                                                                        | UUID                                                                                                      |
| `reports`                                                                                                 | [models.TextqlRpcPublicPlaybookPlaybookReport](../models/textql-rpc-public-playbook-playbook-report.md)[] | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `totalCount`                                                                                              | *number*                                                                                                  | :heavy_minus_sign:                                                                                        | Total number of reports for this template_data_id                                                         |
| `previewCells`                                                                                            | [models.TextqlRpcPublicCellsPreviewCellRef](../models/textql-rpc-public-cells-preview-cell-ref.md)[]      | :heavy_minus_sign:                                                                                        | Execution artifacts (charts, CSVs, etc.) from latest execution                                            |