# TextqlRpcPublicAppRecordAppMemberActivityRequest

Per-member activity log

## Example Usage

```typescript
import { TextqlRpcPublicAppRecordAppMemberActivityRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppRecordAppMemberActivityRequest = {};
```

## Fields

| Field                                                | Type                                                 | Required                                             | Description                                          |
| ---------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| `appId`                                              | *string*                                             | :heavy_minus_sign:                                   | N/A                                                  |
| `type`                                               | *string*                                             | :heavy_minus_sign:                                   | N/A                                                  |
| `scope`                                              | *string*                                             | :heavy_minus_sign:                                   | N/A                                                  |
| `payloadJson`                                        | *string*                                             | :heavy_minus_sign:                                   | JSON object, usage payload authored by the app       |
| `idemKey`                                            | *string*                                             | :heavy_minus_sign:                                   | duplicate key returns the existing row, not an error |