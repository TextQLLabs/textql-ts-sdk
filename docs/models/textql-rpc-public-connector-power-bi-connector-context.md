# TextqlRpcPublicConnectorPowerBIConnectorContext

## Example Usage

```typescript
import { TextqlRpcPublicConnectorPowerBIConnectorContext } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorPowerBIConnectorContext = {};
```

## Fields

| Field                                                               | Type                                                                | Required                                                            | Description                                                         |
| ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `reportIds`                                                         | *string*[]                                                          | :heavy_minus_sign:                                                  | PowerBI report IDs                                                  |
| `datasetIds`                                                        | *string*[]                                                          | :heavy_minus_sign:                                                  | PowerBI dataset IDs (PowerBI datasets, not internal dataset_source) |
| `collectionIds`                                                     | *string*[]                                                          | :heavy_minus_sign:                                                  | workspace dataset_source IDs (cache key, like Tableau collections)  |