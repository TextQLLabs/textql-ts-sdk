# TextqlRpcPublicAppGetAppDBTablePreviewRequest

AppFile is one non-entry file of a multi-file app tree; code remains the entry index.html.

## Example Usage

```typescript
import { TextqlRpcPublicAppGetAppDBTablePreviewRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppGetAppDBTablePreviewRequest = {};
```

## Fields

| Field                                                         | Type                                                          | Required                                                      | Description                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| `appId`                                                       | *string*                                                      | :heavy_minus_sign:                                            | normalized relative path, forward slashes, no .. or leading / |
| `tableName`                                                   | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `limit`                                                       | *number*                                                      | :heavy_minus_sign:                                            | N/A                                                           |