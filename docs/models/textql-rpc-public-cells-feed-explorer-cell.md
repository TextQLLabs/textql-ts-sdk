# TextqlRpcPublicCellsFeedExplorerCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsFeedExplorerCell } from "textql-sdk/models";

let value: TextqlRpcPublicCellsFeedExplorerCell = {};
```

## Fields

| Field                                           | Type                                            | Required                                        | Description                                     |
| ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- | ----------------------------------------------- |
| `operation`                                     | *string*                                        | :heavy_minus_sign:                              | "get_feed", "get_post", "get_comments"          |
| `postId`                                        | *string*                                        | :heavy_minus_sign:                              | N/A                                             |
| `filter`                                        | *string*                                        | :heavy_minus_sign:                              | N/A                                             |
| `limit`                                         | *number*                                        | :heavy_minus_sign:                              | N/A                                             |
| `result`                                        | *string*                                        | :heavy_minus_sign:                              | JSON-serialized result                          |
| `channelId`                                     | *string*                                        | :heavy_minus_sign:                              | when set, get results for specific feed channel |