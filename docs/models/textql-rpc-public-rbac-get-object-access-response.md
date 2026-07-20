# TextqlRpcPublicRbacGetObjectAccessResponse

## Example Usage

```typescript
import { TextqlRpcPublicRbacGetObjectAccessResponse } from "textql-sdk/models";

let value: TextqlRpcPublicRbacGetObjectAccessResponse = {
  accessEntries: [
    {
      expiresAt: new Date("2023-01-15T01:30:15.01Z"),
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                         | Type                                                                                          | Required                                                                                      | Description                                                                                   |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `accessEntries`                                                                               | [models.TextqlRpcPublicRbacObjectAccess](../models/textql-rpc-public-rbac-object-access.md)[] | :heavy_minus_sign:                                                                            | N/A                                                                                           |