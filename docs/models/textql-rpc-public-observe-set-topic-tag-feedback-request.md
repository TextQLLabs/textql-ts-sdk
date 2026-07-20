# TextqlRpcPublicObserveSetTopicTagFeedbackRequest

## Example Usage

```typescript
import { TextqlRpcPublicObserveSetTopicTagFeedbackRequest } from "textql-sdk/models";

let value: TextqlRpcPublicObserveSetTopicTagFeedbackRequest = {};
```

## Fields

| Field                                            | Type                                             | Required                                         | Description                                      |
| ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------ |
| `topicId`                                        | *string*                                         | :heavy_minus_sign:                               | N/A                                              |
| `chatId`                                         | *string*                                         | :heavy_minus_sign:                               | N/A                                              |
| `excluded`                                       | *boolean*                                        | :heavy_minus_sign:                               | false restores verdict='tagged'                  |
| `reason`                                         | *string*                                         | :heavy_minus_sign:                               | optional; fed to the judge as a negative example |