# TextqlRpcPublicObserveRefineTopicDraftResponse

## Example Usage

```typescript
import { TextqlRpcPublicObserveRefineTopicDraftResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicObserveRefineTopicDraftResponse = {};
```

## Fields

| Field                                                                                               | Type                                                                                                | Required                                                                                            | Description                                                                                         |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `name`                                                                                              | *string*                                                                                            | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |
| `covers`                                                                                            | *string*                                                                                            | :heavy_minus_sign:                                                                                  | example questions users ask                                                                         |
| `excludes`                                                                                          | *string*                                                                                            | :heavy_minus_sign:                                                                                  | "should NOT be tagged" phrases                                                                      |
| `vague`                                                                                             | *boolean*                                                                                           | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |
| `qualityHint`                                                                                       | *string*                                                                                            | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |
| `similarTopics`                                                                                     | [models.TextqlRpcPublicObserveSimilarTopic](../models/textql-rpc-public-observe-similar-topic.md)[] | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |