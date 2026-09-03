# TextqlRpcPublicChatFileArtifactData

Request full artifact data when item is selected

## Example Usage

```typescript
import { TextqlRpcPublicChatFileArtifactData } from "@textql/sdk/models";

let value: TextqlRpcPublicChatFileArtifactData = {};
```

## Fields

| Field                                                                                       | Type                                                                                        | Required                                                                                    | Description                                                                                 |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `url`                                                                                       | *string*                                                                                    | :heavy_minus_sign:                                                                          | Cell ID or composite "cellId:type:url" for multi-artifact cells                             |
| `type`                                                                                      | [models.TextqlRpcPublicChatArtifactType](../models/textql-rpc-public-chat-artifact-type.md) | :heavy_minus_sign:                                                                          | N/A                                                                                         |