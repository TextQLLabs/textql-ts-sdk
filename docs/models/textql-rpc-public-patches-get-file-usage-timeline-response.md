# TextqlRpcPublicPatchesGetFileUsageTimelineResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesGetFileUsageTimelineResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesGetFileUsageTimelineResponse = {};
```

## Fields

| Field                                                                                                    | Type                                                                                                     | Required                                                                                                 | Description                                                                                              |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `days`                                                                                                   | [models.TextqlRpcPublicPatchesDailyFileUsage](../models/textql-rpc-public-patches-daily-file-usage.md)[] | :heavy_minus_sign:                                                                                       | one entry per UTC day in the window, oldest first; idle days zero-filled                                 |