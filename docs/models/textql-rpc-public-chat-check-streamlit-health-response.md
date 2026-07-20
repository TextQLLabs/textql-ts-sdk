# TextqlRpcPublicChatCheckStreamlitHealthResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatCheckStreamlitHealthResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicChatCheckStreamlitHealthResponse = {
  cell: {
    microsoft365EmailContentCell: {},
    timestamp: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                          | Type                                                                                                           | Required                                                                                                       | Description                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `status`                                                                                                       | [models.TextqlRpcPublicChatStreamlitHealthStatus](../models/textql-rpc-public-chat-streamlit-health-status.md) | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `cell`                                                                                                         | *models.TextqlRpcPublicChatCell*                                                                               | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `embedUrl`                                                                                                     | *string*                                                                                                       | :heavy_minus_sign:                                                                                             | Dynamic URL from state manager                                                                                 |
| `streamlitUrl`                                                                                                 | *string*                                                                                                       | :heavy_minus_sign:                                                                                             | Raw workerId:port format                                                                                       |