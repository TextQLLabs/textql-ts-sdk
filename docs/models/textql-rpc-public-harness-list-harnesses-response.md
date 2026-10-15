# TextqlRpcPublicHarnessListHarnessesResponse

## Example Usage

```typescript
import { TextqlRpcPublicHarnessListHarnessesResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicHarnessListHarnessesResponse = {
  endpoints: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      lastTestedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                     | Type                                                                                                      | Required                                                                                                  | Description                                                                                               |
| --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `enabled`                                                                                                 | *boolean*                                                                                                 | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `endpoints`                                                                                               | [models.TextqlRpcPublicHarnessHarnessEndpoint](../models/textql-rpc-public-harness-harness-endpoint.md)[] | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `harnesses`                                                                                               | [models.TextqlRpcPublicHarnessHarnessInfo](../models/textql-rpc-public-harness-harness-info.md)[]         | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |
| `viewer`                                                                                                  | [models.TextqlRpcPublicHarnessHarnessViewer](../models/textql-rpc-public-harness-harness-viewer.md)       | :heavy_minus_sign:                                                                                        | N/A                                                                                                       |