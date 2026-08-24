# TextqlRpcPublicSettingsUpdateOrganizationModelSettingsRequest

## Example Usage

```typescript
import { TextqlRpcPublicSettingsUpdateOrganizationModelSettingsRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicSettingsUpdateOrganizationModelSettingsRequest = {};
```

## Fields

| Field                                                                                 | Type                                                                                  | Required                                                                              | Description                                                                           |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `defaultModel`                                                                        | [models.TextqlRpcPublicChatLlmModel](../models/textql-rpc-public-chat-llm-model.md)   | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `enabledModels`                                                                       | [models.TextqlRpcPublicChatLlmModel](../models/textql-rpc-public-chat-llm-model.md)[] | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `clearEnabledModels`                                                                  | *boolean*                                                                             | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `restrictedModels`                                                                    | [models.TextqlRpcPublicChatLlmModel](../models/textql-rpc-public-chat-llm-model.md)[] | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `clearRestrictedModels`                                                               | *boolean*                                                                             | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `restrictedFamilies`                                                                  | *string*[]                                                                            | :heavy_minus_sign:                                                                    | N/A                                                                                   |
| `clearRestrictedFamilies`                                                             | *boolean*                                                                             | :heavy_minus_sign:                                                                    | N/A                                                                                   |