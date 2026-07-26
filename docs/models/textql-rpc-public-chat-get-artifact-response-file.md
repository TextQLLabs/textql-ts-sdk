# TextqlRpcPublicChatGetArtifactResponseFile

## Example Usage

```typescript
import { TextqlRpcPublicChatGetArtifactResponseFile } from "@textql/sdk/models";

let value: TextqlRpcPublicChatGetArtifactResponseFile = {
  file: {},
};
```

## Fields

| Field                                                                                                | Type                                                                                                 | Required                                                                                             | Description                                                                                          |
| ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `file`                                                                                               | [models.TextqlRpcPublicChatFileArtifactData](../models/textql-rpc-public-chat-file-artifact-data.md) | :heavy_check_mark:                                                                                   | Request full artifact data when item is selected                                                     |
| `id`                                                                                                 | *string*                                                                                             | :heavy_minus_sign:                                                                                   | Flat list, sorted by created_at DESC                                                                 |
| `name`                                                                                               | *string*                                                                                             | :heavy_minus_sign:                                                                                   | N/A                                                                                                  |