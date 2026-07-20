# TextqlRpcPublicSandboxAdminListSandboxEgressResponse

## Example Usage

```typescript
import { TextqlRpcPublicSandboxAdminListSandboxEgressResponse } from "textql-sdk/models";

let value: TextqlRpcPublicSandboxAdminListSandboxEgressResponse = {
  calls: [
    {
      occurredAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                     | Type                                                                                                                      | Required                                                                                                                  | Description                                                                                                               |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `calls`                                                                                                                   | [models.TextqlRpcPublicSandboxAdminSandboxEgressCall](../models/textql-rpc-public-sandbox-admin-sandbox-egress-call.md)[] | :heavy_minus_sign:                                                                                                        | Newest first.                                                                                                             |