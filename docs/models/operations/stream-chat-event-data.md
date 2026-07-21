# StreamChatEventData

A chat stream event. `type` discriminates the payload: `metadata` (id, chat_id, model, created_at, is_continuation), `text` (text), `cell` (cell), `asset` (asset), `error` (message), and `done`.

## Example Usage

```typescript
import { StreamChatEventData } from "@textql/sdk/models/operations";

let value: StreamChatEventData = {
  type: "<value>",
};
```

## Fields

| Field                                                    | Type                                                     | Required                                                 | Description                                              |
| -------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| `type`                                                   | *string*                                                 | :heavy_check_mark:                                       | Event type: metadata, text, cell, asset, error, or done. |
| `additionalProperties`                                   | Record<string, *any*>                                    | :heavy_minus_sign:                                       | N/A                                                      |