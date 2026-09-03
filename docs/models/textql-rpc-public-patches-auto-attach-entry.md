# TextqlRpcPublicPatchesAutoAttachEntry

## Example Usage

```typescript
import { TextqlRpcPublicPatchesAutoAttachEntry } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesAutoAttachEntry = {};
```

## Fields

| Field                                                                 | Type                                                                  | Required                                                              | Description                                                           |
| --------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `path`                                                                | *string*                                                              | :heavy_minus_sign:                                                    | N/A                                                                   |
| `connectorId`                                                         | *number*                                                              | :heavy_minus_sign:                                                    | deprecated: use connector_ids                                         |
| `apiConnectorIds`                                                     | *string*[]                                                            | :heavy_minus_sign:                                                    | N/A                                                                   |
| `roleIds`                                                             | *string*[]                                                            | :heavy_minus_sign:                                                    | N/A                                                                   |
| `connectorIds`                                                        | *number*[]                                                            | :heavy_minus_sign:                                                    | multiple connectors (OR logic); overrides connector_id when non-empty |
| `matchNoConnector`                                                    | *boolean*                                                             | :heavy_minus_sign:                                                    | true = only match when no connector is active                         |
| `matchNoApiConnector`                                                 | *boolean*                                                             | :heavy_minus_sign:                                                    | true = only match when no API connector is active                     |
| `matchAll`                                                            | *boolean*                                                             | :heavy_minus_sign:                                                    | true = always attach regardless of other conditions                   |