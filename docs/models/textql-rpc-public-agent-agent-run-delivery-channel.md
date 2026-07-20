# TextqlRpcPublicAgentAgentRunDeliveryChannel

## Example Usage

```typescript
import { TextqlRpcPublicAgentAgentRunDeliveryChannel } from "textql-sdk/models";

let value: TextqlRpcPublicAgentAgentRunDeliveryChannel = {};
```

## Fields

| Field                                                                      | Type                                                                       | Required                                                                   | Description                                                                |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `type`                                                                     | *string*                                                                   | :heavy_minus_sign:                                                         | slack_channel \| teams_channel \| slack_dm \| teams_dm \| email \| feed_channel |
| `id`                                                                       | *string*                                                                   | :heavy_minus_sign:                                                         | raw identifier (channel id, member id, aad id)                             |
| `label`                                                                    | *string*                                                                   | :heavy_minus_sign:                                                         | resolved human-readable label (#channel, email address)                    |