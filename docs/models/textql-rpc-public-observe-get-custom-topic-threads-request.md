# TextqlRpcPublicObserveGetCustomTopicThreadsRequest

## Example Usage

```typescript
import { TextqlRpcPublicObserveGetCustomTopicThreadsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicObserveGetCustomTopicThreadsRequest = {};
```

## Fields

| Field                                      | Type                                       | Required                                   | Description                                |
| ------------------------------------------ | ------------------------------------------ | ------------------------------------------ | ------------------------------------------ |
| `topicId`                                  | *string*                                   | :heavy_minus_sign:                         | N/A                                        |
| `verdict`                                  | *string*                                   | :heavy_minus_sign:                         | 'tagged' (default) \| 'excluded_manual'    |
| `pageToken`                                | *string*                                   | :heavy_minus_sign:                         | N/A                                        |
| `pageSize`                                 | *number*                                   | :heavy_minus_sign:                         | N/A                                        |
| `memberId`                                 | *string*                                   | :heavy_minus_sign:                         | only threads owned by this member when set |