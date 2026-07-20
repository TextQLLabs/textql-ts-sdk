# TextqlRpcPublicChatGetChatArtifactsSummaryResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatGetChatArtifactsSummaryResponse } from "textql-sdk/models";

let value: TextqlRpcPublicChatGetChatArtifactsSummaryResponse = {
  artifacts: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                               | Type                                                                                                | Required                                                                                            | Description                                                                                         |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `artifacts`                                                                                         | [models.TextqlRpcPublicChatArtifactSummary](../models/textql-rpc-public-chat-artifact-summary.md)[] | :heavy_minus_sign:                                                                                  | Flat list, sorted by created_at DESC                                                                |