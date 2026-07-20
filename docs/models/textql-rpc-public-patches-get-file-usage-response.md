# TextqlRpcPublicPatchesGetFileUsageResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesGetFileUsageResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesGetFileUsageResponse = {
  files: [
    {
      lastPulled: new Date("2023-01-15T01:30:15.01Z"),
      lastRun: new Date("2023-01-15T01:30:15.01Z"),
      lastUsed: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                         | Type                                                                                          | Required                                                                                      | Description                                                                                   |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `files`                                                                                       | [models.TextqlRpcPublicPatchesFileUsage](../models/textql-rpc-public-patches-file-usage.md)[] | :heavy_minus_sign:                                                                            | N/A                                                                                           |
| `nextPageCursor`                                                                              | *string*                                                                                      | :heavy_minus_sign:                                                                            | N/A                                                                                           |