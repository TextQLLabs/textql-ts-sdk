# TextqlRpcPublicChatGetArtifactRequest

Request full artifact data when item is selected

## Example Usage

```typescript
import { TextqlRpcPublicChatGetArtifactRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicChatGetArtifactRequest = {
  artifactId: "<id>",
  chatId: "<id>",
};
```

## Fields

| Field                                                           | Type                                                            | Required                                                        | Description                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| `artifactId`                                                    | *string*                                                        | :heavy_check_mark:                                              | Cell ID or composite "cellId:type:url" for multi-artifact cells |
| `chatId`                                                        | *string*                                                        | :heavy_check_mark:                                              | N/A                                                             |