# StreamChatEvent

A successful response.(streaming responses)

## Example Usage

```typescript
import { StreamChatEvent } from "@textql/sdk/models/operations";

let value: StreamChatEvent = {
  data: {
    result: {
      useSkillCell: {},
      timestamp: new Date("2023-01-15T01:30:15.01Z"),
    },
  },
};
```

## Fields

| Field                                                                                                 | Type                                                                                                  | Required                                                                                              | Description                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `data`                                                                                                | [operations.StreamChatEventData](../../models/operations/stream-chat-event-data.md)                   | :heavy_check_mark:                                                                                    | One stream envelope: `result` carries the next cell, `error` reports a failure that ended the stream. |