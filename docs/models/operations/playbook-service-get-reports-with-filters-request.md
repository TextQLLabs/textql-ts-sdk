# PlaybookServiceGetReportsWithFiltersRequest

## Example Usage

```typescript
import { PlaybookServiceGetReportsWithFiltersRequest } from "textql-sdk/models/operations";

let value: PlaybookServiceGetReportsWithFiltersRequest = {
  connectProtocolVersion: 1,
  body: {
    filters: {
      startTime: new Date("2023-01-15T01:30:15.01Z"),
      endTime: new Date("2023-01-15T01:30:15.01Z"),
    },
  },
};
```

## Fields

| Field                                                                                                                                     | Type                                                                                                                                      | Required                                                                                                                                  | Description                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                                  | *1*                                                                                                                                       | :heavy_check_mark:                                                                                                                        | N/A                                                                                                                                       |
| `connectTimeoutMs`                                                                                                                        | *number*                                                                                                                                  | :heavy_minus_sign:                                                                                                                        | N/A                                                                                                                                       |
| `body`                                                                                                                                    | [models.TextqlRpcPublicPlaybookGetReportsWithFiltersRequest](../../models/textql-rpc-public-playbook-get-reports-with-filters-request.md) | :heavy_check_mark:                                                                                                                        | N/A                                                                                                                                       |