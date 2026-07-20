# TextqlRpcPublicDatasetTableauData

## Example Usage

```typescript
import { TextqlRpcPublicDatasetTableauData } from "@textql/sdk/models";

let value: TextqlRpcPublicDatasetTableauData = {
  views: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
  datasources: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
      updatedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                         | Type                                                                                                          | Required                                                                                                      | Description                                                                                                   |
| ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `connectorId`                                                                                                 | *number*                                                                                                      | :heavy_minus_sign:                                                                                            | N/A                                                                                                           |
| `projectId`                                                                                                   | *string*                                                                                                      | :heavy_minus_sign:                                                                                            | N/A                                                                                                           |
| `projectName`                                                                                                 | *string*                                                                                                      | :heavy_minus_sign:                                                                                            | N/A                                                                                                           |
| `views`                                                                                                       | [models.TextqlRpcPublicTableauTableauView](../models/textql-rpc-public-tableau-tableau-view.md)[]             | :heavy_minus_sign:                                                                                            | N/A                                                                                                           |
| `datasources`                                                                                                 | [models.TextqlRpcPublicTableauTableauDatasource](../models/textql-rpc-public-tableau-tableau-datasource.md)[] | :heavy_minus_sign:                                                                                            | N/A                                                                                                           |