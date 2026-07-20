# TextqlRpcPublicConnectorMessageSegment

A segment of an example query message - either plain text or a styled feature word

## Example Usage

```typescript
import { TextqlRpcPublicConnectorMessageSegment } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorMessageSegment = {};
```

## Fields

| Field                                                                                               | Type                                                                                                | Required                                                                                            | Description                                                                                         |
| --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `content`                                                                                           | *string*                                                                                            | :heavy_minus_sign:                                                                                  | The text content of this segment                                                                    |
| `featureType`                                                                                       | [models.TextqlRpcPublicConnectorFeatureType](../models/textql-rpc-public-connector-feature-type.md) | :heavy_minus_sign:                                                                                  | Feature types for nudge queries - identifies which feature a query promotes                         |