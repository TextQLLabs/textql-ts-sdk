# TextqlRpcPublicDatasetGetDatasetValuesRequest

## Example Usage

```typescript
import { TextqlRpcPublicDatasetGetDatasetValuesRequest } from "textql-sdk/models";

let value: TextqlRpcPublicDatasetGetDatasetValuesRequest = {};
```

## Fields

| Field                     | Type                      | Required                  | Description               |
| ------------------------- | ------------------------- | ------------------------- | ------------------------- |
| `datasetId`               | *string*                  | :heavy_minus_sign:        | N/A                       |
| `versionId`               | *number*                  | :heavy_minus_sign:        | default to latest version |
| `limit`                   | *number*                  | :heavy_minus_sign:        | defaults to 10,000        |
| `page`                    | *number*                  | :heavy_minus_sign:        | N/A                       |
| `sheet`                   | *number*                  | :heavy_minus_sign:        | for multi-sheet excels    |