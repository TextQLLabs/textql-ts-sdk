# TextqlRpcPublicRbacListAccessRequestsResponse

## Example Usage

```typescript
import { TextqlRpcPublicRbacListAccessRequestsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicRbacListAccessRequestsResponse = {
  requests: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                           | Type                                                                                            | Required                                                                                        | Description                                                                                     |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `requests`                                                                                      | [models.TextqlRpcPublicRbacAccessRequest](../models/textql-rpc-public-rbac-access-request.md)[] | :heavy_minus_sign:                                                                              | N/A                                                                                             |