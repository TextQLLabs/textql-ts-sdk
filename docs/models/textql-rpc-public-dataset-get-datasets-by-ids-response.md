# TextqlRpcPublicDatasetGetDatasetsByIdsResponse

## Example Usage

```typescript
import { TextqlRpcPublicDatasetGetDatasetsByIdsResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicDatasetGetDatasetsByIdsResponse = {
  datasets: [
    {
      powerbiData: {},
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
      expiresAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                    | Type                                     | Required                                 | Description                              |
| ---------------------------------------- | ---------------------------------------- | ---------------------------------------- | ---------------------------------------- |
| `datasets`                               | *models.TextqlRpcPublicDatasetDataset*[] | :heavy_minus_sign:                       | N/A                                      |