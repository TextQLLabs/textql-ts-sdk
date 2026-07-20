# PowerBIServiceSyncPowerBIItemsRequest

## Example Usage

```typescript
import { PowerBIServiceSyncPowerBIItemsRequest } from "textql-sdk/models/operations";

let value: PowerBIServiceSyncPowerBIItemsRequest = {
  body: {
    reports: [
      {
        createdDate: new Date("2023-01-15T01:30:15.01Z"),
      },
    ],
    datasets: [
      {
        createdDate: new Date("2023-01-15T01:30:15.01Z"),
      },
    ],
  },
};
```

## Fields

| Field                                                                                                                         | Type                                                                                                                          | Required                                                                                                                      | Description                                                                                                                   |
| ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                      | *1*                                                                                                                           | :heavy_check_mark:                                                                                                            | N/A                                                                                                                           |
| `connectTimeoutMs`                                                                                                            | *number*                                                                                                                      | :heavy_minus_sign:                                                                                                            | N/A                                                                                                                           |
| `body`                                                                                                                        | [models.TextqlRpcPublicPowerbiSyncPowerBIItemsRequest](../../models/textql-rpc-public-powerbi-sync-power-bi-items-request.md) | :heavy_check_mark:                                                                                                            | N/A                                                                                                                           |