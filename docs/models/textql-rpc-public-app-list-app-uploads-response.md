# TextqlRpcPublicAppListAppUploadsResponse

## Example Usage

```typescript
import { TextqlRpcPublicAppListAppUploadsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicAppListAppUploadsResponse = {
  items: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                          | Type                                                                                           | Required                                                                                       | Description                                                                                    |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `items`                                                                                        | [models.TextqlRpcPublicAppAppUploadItem](../models/textql-rpc-public-app-app-upload-item.md)[] | :heavy_minus_sign:                                                                             | N/A                                                                                            |
| `nextPageToken`                                                                                | *string*                                                                                       | :heavy_minus_sign:                                                                             | Continue until empty. A page can be short/empty after permission filtering.                    |