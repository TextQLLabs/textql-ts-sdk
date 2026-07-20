# TextqlRpcPublicConnectorQueryResult

## Example Usage

```typescript
import { TextqlRpcPublicConnectorQueryResult } from "textql-sdk/models";

let value: TextqlRpcPublicConnectorQueryResult = {};
```

## Fields

| Field                                                 | Type                                                  | Required                                              | Description                                           |
| ----------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| `arrowData`                                           | *string*                                              | :heavy_minus_sign:                                    | Apache Arrow IPC format binary data                   |
| `totalRows`                                           | *models.TextqlRpcPublicConnectorQueryResultTotalRows* | :heavy_minus_sign:                                    | Total number of rows (for pagination/UI purposes)     |