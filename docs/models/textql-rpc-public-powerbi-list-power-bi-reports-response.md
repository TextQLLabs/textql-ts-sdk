# TextqlRpcPublicPowerbiListPowerBIReportsResponse

## Example Usage

```typescript
import { TextqlRpcPublicPowerbiListPowerBIReportsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicPowerbiListPowerBIReportsResponse = {
  reports: [
    {
      createdDate: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                  | Type                                                                                                   | Required                                                                                               | Description                                                                                            |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `reports`                                                                                              | [models.TextqlRpcPublicPowerbiPowerBIReport](../models/textql-rpc-public-powerbi-power-bi-report.md)[] | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |
| `error`                                                                                                | *string*                                                                                               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |