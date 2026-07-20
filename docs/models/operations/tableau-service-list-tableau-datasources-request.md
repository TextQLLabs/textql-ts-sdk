# TableauServiceListTableauDatasourcesRequest

## Example Usage

```typescript
import { TableauServiceListTableauDatasourcesRequest } from "textql-sdk/models/operations";

let value: TableauServiceListTableauDatasourcesRequest = {
  connectProtocolVersion: 1,
  body: {
    workbookId: "<id>",
  },
};
```

## Fields

| Field                                                        | Type                                                         | Required                                                     | Description                                                  |
| ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| `connectProtocolVersion`                                     | *1*                                                          | :heavy_check_mark:                                           | N/A                                                          |
| `connectTimeoutMs`                                           | *number*                                                     | :heavy_minus_sign:                                           | N/A                                                          |
| `body`                                                       | *models.TextqlRpcPublicTableauListTableauDatasourcesRequest* | :heavy_check_mark:                                           | N/A                                                          |