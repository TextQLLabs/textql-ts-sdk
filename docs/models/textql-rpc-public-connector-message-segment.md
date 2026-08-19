# TextqlRpcPublicConnectorMessageSegment

## Example Usage

```typescript
import { TextqlRpcPublicConnectorMessageSegment } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorMessageSegment = {};
```

## Fields

| Field                                                                                               | Type                                                                                                | Required                                                                                            | Description                                                                                         |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `content`                                                                                           | *string*                                                                                            | :heavy_minus_sign:                                                                                  | dataset IDs for selected Tableau collections                                                        |
| `featureType`                                                                                       | [models.TextqlRpcPublicConnectorFeatureType](../models/textql-rpc-public-connector-feature-type.md) | :heavy_minus_sign:                                                                                  | Feature types for nudge queries - identifies which feature a query promotes                         |