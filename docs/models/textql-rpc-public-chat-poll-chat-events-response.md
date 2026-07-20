# TextqlRpcPublicChatPollChatEventsResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatPollChatEventsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicChatPollChatEventsResponse = {
  events: [
    {
      opened: {},
    },
  ],
};
```

## Fields

| Field                                        | Type                                         | Required                                     | Description                                  |
| -------------------------------------------- | -------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| `events`                                     | *models.TextqlRpcPublicChatWatchChatEvent*[] | :heavy_minus_sign:                           | N/A                                          |
| `cursor`                                     | *string*                                     | :heavy_minus_sign:                           | N/A                                          |
| `running`                                    | *boolean*                                    | :heavy_minus_sign:                           | N/A                                          |
| `generation`                                 | *models.Generation*                          | :heavy_minus_sign:                           | N/A                                          |