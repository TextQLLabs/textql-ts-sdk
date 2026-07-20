# TextqlRpcPublicAppListAppVersionsRequest

AppFile is one non-entry file of a multi-file app tree; code remains the entry index.html.

## Example Usage

```typescript
import { TextqlRpcPublicAppListAppVersionsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppListAppVersionsRequest = {};
```

## Fields

| Field                                                         | Type                                                          | Required                                                      | Description                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| `appId`                                                       | *string*                                                      | :heavy_minus_sign:                                            | normalized relative path, forward slashes, no .. or leading / |
| `limit`                                                       | *number*                                                      | :heavy_minus_sign:                                            | N/A                                                           |
| `offset`                                                      | *number*                                                      | :heavy_minus_sign:                                            | N/A                                                           |