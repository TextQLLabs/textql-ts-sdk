# TextqlRpcPublicRbacCreateRolePermissionsUploadUrlResponse

## Example Usage

```typescript
import { TextqlRpcPublicRbacCreateRolePermissionsUploadUrlResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacCreateRolePermissionsUploadUrlResponse = {};
```

## Fields

| Field                                                                                    | Type                                                                                     | Required                                                                                 | Description                                                                              |
| ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `uploadUrl`                                                                              | *string*                                                                                 | :heavy_minus_sign:                                                                       | PUT the file here, using content_type, then pass file_key to ParseRolePermissionsImport. |
| `fileUrl`                                                                                | *string*                                                                                 | :heavy_minus_sign:                                                                       | N/A                                                                                      |
| `contentType`                                                                            | *string*                                                                                 | :heavy_minus_sign:                                                                       | N/A                                                                                      |
| `fileKey`                                                                                | *string*                                                                                 | :heavy_minus_sign:                                                                       | N/A                                                                                      |