# TextqlRpcPublicSandboxAdminListSandboxesResponse

## Example Usage

```typescript
import { TextqlRpcPublicSandboxAdminListSandboxesResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicSandboxAdminListSandboxesResponse = {
  sandboxes: [
    {
      startedAt: new Date("2023-01-15T01:30:15.01Z"),
      releasedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                              | Type                                                                                                               | Required                                                                                                           | Description                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `sandboxes`                                                                                                        | [models.TextqlRpcPublicSandboxAdminSandboxSummary](../models/textql-rpc-public-sandbox-admin-sandbox-summary.md)[] | :heavy_minus_sign:                                                                                                 | N/A                                                                                                                |
| `nextCursor`                                                                                                       | *string*                                                                                                           | :heavy_minus_sign:                                                                                                 | N/A                                                                                                                |