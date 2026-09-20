# TextqlRpcPublicAppListAppsRequest

## Example Usage

```typescript
import { TextqlRpcPublicAppListAppsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppListAppsRequest = {};
```

## Fields

| Field                                                   | Type                                                    | Required                                                | Description                                             |
| ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| `searchTerm`                                            | *string*                                                | :heavy_minus_sign:                                      | N/A                                                     |
| `limit`                                                 | *number*                                                | :heavy_minus_sign:                                      | N/A                                                     |
| `offset`                                                | *number*                                                | :heavy_minus_sign:                                      | N/A                                                     |
| `folderId`                                              | *string*                                                | :heavy_minus_sign:                                      | Filter by specific folder                               |
| `uncategorizedOnly`                                     | *boolean*                                               | :heavy_minus_sign:                                      | Only show apps with no folder                           |
| `sharedWithMe`                                          | *boolean*                                               | :heavy_minus_sign:                                      | Only apps shared with the caller (not authored by them) |