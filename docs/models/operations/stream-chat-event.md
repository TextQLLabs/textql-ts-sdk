# StreamChatEvent

A successful response.(streaming responses)

## Example Usage

```typescript
import { StreamChatEvent } from "@textql/sdk/models/operations";

let value: StreamChatEvent = {
  data: {
    type: "<value>",
  },
};
```

## Fields

| Field                                                                                                                                                                                              | Type                                                                                                                                                                                               | Required                                                                                                                                                                                           | Description                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `data`                                                                                                                                                                                             | [operations.StreamChatEventData](../../models/operations/stream-chat-event-data.md)                                                                                                                | :heavy_check_mark:                                                                                                                                                                                 | A chat stream event. `type` discriminates the payload: `metadata` (id, chat_id, model, created_at, is_continuation), `text` (text), `cell` (cell), `asset` (asset), `error` (message), and `done`. |