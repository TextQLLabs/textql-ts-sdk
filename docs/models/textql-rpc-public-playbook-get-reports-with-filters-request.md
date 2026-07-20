# TextqlRpcPublicPlaybookGetReportsWithFiltersRequest

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookGetReportsWithFiltersRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicPlaybookGetReportsWithFiltersRequest = {
  filters: {
    startTime: new Date("2023-01-15T01:30:15.01Z"),
    endTime: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                 | Type                                                                                                  | Required                                                                                              | Description                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `filters`                                                                                             | [models.TextqlRpcPublicPlaybookReportFilters](../models/textql-rpc-public-playbook-report-filters.md) | :heavy_minus_sign:                                                                                    | N/A                                                                                                   |