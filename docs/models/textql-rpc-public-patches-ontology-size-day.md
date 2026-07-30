# TextqlRpcPublicPatchesOntologySizeDay

FileChatUsage is one chat that retrieved a ontology file inside the
 observation window. Only pulls attributed to a chat are listed — background
 or sandbox reads carry no chat id and are excluded.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesOntologySizeDay } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesOntologySizeDay = {};
```

## Fields

| Field                                                                            | Type                                                                             | Required                                                                         | Description                                                                      |
| -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `date`                                                                           | [models.TextqlRpcPublicPatchesDate](../models/textql-rpc-public-patches-date.md) | :heavy_minus_sign:                                                               | N/A                                                                              |
| `totalBytes`                                                                     | *models.TotalBytes*                                                              | :heavy_minus_sign:                                                               | empty for untitled chats                                                         |
| `fileCount`                                                                      | *number*                                                                         | :heavy_minus_sign:                                                               | N/A                                                                              |