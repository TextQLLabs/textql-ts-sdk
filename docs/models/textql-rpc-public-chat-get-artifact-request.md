# TextqlRpcPublicChatGetArtifactRequest

Request full artifact data when item is selected

## Example Usage

```typescript
import { TextqlRpcPublicChatGetArtifactRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicChatGetArtifactRequest = {};
```

## Fields

| Field                                                           | Type                                                            | Required                                                        | Description                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| `artifactId`                                                    | *string*                                                        | :heavy_minus_sign:                                              | Cell ID or composite "cellId:type:url" for multi-artifact cells |
| `chatId`                                                        | *string*                                                        | :heavy_minus_sign:                                              | N/A                                                             |