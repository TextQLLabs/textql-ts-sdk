# TextqlRpcPublicObserveCustomTopicPerson

One owner of a topic's tagged chats, ranked by how many they own.

## Example Usage

```typescript
import { TextqlRpcPublicObserveCustomTopicPerson } from "textql-sdk/models";

let value: TextqlRpcPublicObserveCustomTopicPerson = {};
```

## Fields

| Field                                                     | Type                                                      | Required                                                  | Description                                               |
| --------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------- |
| `memberId`                                                | *string*                                                  | :heavy_minus_sign:                                        | N/A                                                       |
| `name`                                                    | *string*                                                  | :heavy_minus_sign:                                        | display name; falls back to the email, then the member id |
| `email`                                                   | *string*                                                  | :heavy_minus_sign:                                        | N/A                                                       |
| `threadCount`                                             | *models.ThreadCount*                                      | :heavy_minus_sign:                                        | N/A                                                       |