# TextqlRpcPublicObserveGetCustomTopicThreadsResponse

## Example Usage

```typescript
import { TextqlRpcPublicObserveGetCustomTopicThreadsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicObserveGetCustomTopicThreadsResponse = {
  threads: [
    {
      taggedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                          | Type                                                                                                           | Required                                                                                                       | Description                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `threads`                                                                                                      | [models.TextqlRpcPublicObserveCustomTopicThread](../models/textql-rpc-public-observe-custom-topic-thread.md)[] | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `nextPageToken`                                                                                                | *string*                                                                                                       | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |