# TextqlRpcPublicConnectorGetExampleQueriesRequest

## Example Usage

```typescript
import { TextqlRpcPublicConnectorGetExampleQueriesRequest } from "textql-sdk/models";

let value: TextqlRpcPublicConnectorGetExampleQueriesRequest = {};
```

## Fields

| Field                                                                                               | Type                                                                                                | Required                                                                                            | Description                                                                                         |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `connectorContexts`                                                                                 | *models.TextqlRpcPublicConnectorConnectorContext*[]                                                 | :heavy_minus_sign:                                                                                  | N/A                                                                                                 |
| `featureFilter`                                                                                     | [models.TextqlRpcPublicConnectorFeatureType](../models/textql-rpc-public-connector-feature-type.md) | :heavy_minus_sign:                                                                                  | Feature types for nudge queries - identifies which feature a query promotes                         |