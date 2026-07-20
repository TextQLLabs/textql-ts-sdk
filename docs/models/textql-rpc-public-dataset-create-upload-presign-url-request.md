# TextqlRpcPublicDatasetCreateUploadPresignUrlRequest

## Example Usage

```typescript
import { TextqlRpcPublicDatasetCreateUploadPresignUrlRequest } from "textql-sdk/models";

let value: TextqlRpcPublicDatasetCreateUploadPresignUrlRequest = {};
```

## Fields

| Field                                                                                           | Type                                                                                            | Required                                                                                        | Description                                                                                     |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `type`                                                                                          | [models.TextqlRpcPublicDatasetDatasetType](../models/textql-rpc-public-dataset-dataset-type.md) | :heavy_minus_sign:                                                                              | never change the names or numbers of existing dataset types!                                    |
| `fileName`                                                                                      | *string*                                                                                        | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `folderPath`                                                                                    | *string*[]                                                                                      | :heavy_minus_sign:                                                                              | if this dataset lives in a folder                                                               |
| `ephemeral`                                                                                     | *boolean*                                                                                       | :heavy_minus_sign:                                                                              | N/A                                                                                             |
| `expiresInDays`                                                                                 | *number*                                                                                        | :heavy_minus_sign:                                                                              | N/A                                                                                             |