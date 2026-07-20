# Cell

## Example Usage

```typescript
import { Cell } from "textql-sdk/models";

let value: Cell = {
  cell: {
    feedPostCell: {},
    timestamp: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                            | Type                             | Required                         | Description                      |
| -------------------------------- | -------------------------------- | -------------------------------- | -------------------------------- |
| `cell`                           | *models.TextqlRpcPublicChatCell* | :heavy_check_mark:               | N/A                              |
| `cursor`                         | *string*                         | :heavy_minus_sign:               | N/A                              |