# TextqlRpcPublicObserveGetChatTopicsResponse

## Example Usage

```typescript
import { TextqlRpcPublicObserveGetChatTopicsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicObserveGetChatTopicsResponse = {};
```

## Fields

| Field                                                                                                                | Type                                                                                                                 | Required                                                                                                             | Description                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `topicsByChat`                                                                                                       | Record<string, [models.TextqlRpcPublicObserveChatTopicList](../models/textql-rpc-public-observe-chat-topic-list.md)> | :heavy_minus_sign:                                                                                                   | Keyed by chat id; chats with no tagged topics are absent.                                                            |