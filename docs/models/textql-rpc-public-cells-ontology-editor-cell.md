# TextqlRpcPublicCellsOntologyEditorCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsOntologyEditorCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsOntologyEditorCell = {
  listObjects: [
    {
      backingQuery: "<value>",
      accessTime: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
  listAttributes: [
    {
      accessTime: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
  listMetrics: [
    {
      accessTime: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
  createdObject: {
    backingQuery: "<value>",
    accessTime: new Date("2023-01-15T01:30:15.01Z"),
  },
  createdAttributes: [
    {
      accessTime: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
  updatedObject: {
    backingTable: {},
    accessTime: new Date("2023-01-15T01:30:15.01Z"),
  },
  deletedObject: {
    backingQuery: "<value>",
    accessTime: new Date("2023-01-15T01:30:15.01Z"),
  },
  createdAttribute: {
    accessTime: new Date("2023-01-15T01:30:15.01Z"),
  },
  updatedAttribute: {
    accessTime: new Date("2023-01-15T01:30:15.01Z"),
  },
  deletedAttribute: {
    accessTime: new Date("2023-01-15T01:30:15.01Z"),
  },
  createdMetric: {
    accessTime: new Date("2023-01-15T01:30:15.01Z"),
  },
  updatedMetric: {
    accessTime: new Date("2023-01-15T01:30:15.01Z"),
  },
  deletedMetric: {
    accessTime: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                                   | Type                                                                                                                    | Required                                                                                                                | Description                                                                                                             |
| ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `action`                                                                                                                | [models.TextqlRpcPublicCellsOntologyEditorAction](../models/textql-rpc-public-cells-ontology-editor-action.md)          | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `listType`                                                                                                              | [models.TextqlRpcPublicCellsOntologyEditorListType](../models/textql-rpc-public-cells-ontology-editor-list-type.md)     | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `operation`                                                                                                             | [models.TextqlRpcPublicCellsOntologyEditorOperation](../models/textql-rpc-public-cells-ontology-editor-operation.md)    | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `status`                                                                                                                | [models.TextqlRpcPublicCellsOntologyEditorStatus](../models/textql-rpc-public-cells-ontology-editor-status.md)          | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `listFilter`                                                                                                            | [models.TextqlRpcPublicCellsOntologyEditorListFilter](../models/textql-rpc-public-cells-ontology-editor-list-filter.md) | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `listCount`                                                                                                             | *number*                                                                                                                | :heavy_minus_sign:                                                                                                      | Number of items returned by list operation                                                                              |
| `listObjects`                                                                                                           | *models.TextqlRpcPublicOntologyOntologyObject*[]                                                                        | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `listAttributes`                                                                                                        | [models.TextqlRpcPublicOntologyOntologyAttribute](../models/textql-rpc-public-ontology-ontology-attribute.md)[]         | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `listRelations`                                                                                                         | [models.TextqlRpcPublicOntologyOntologyRelation](../models/textql-rpc-public-ontology-ontology-relation.md)[]           | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `listMetrics`                                                                                                           | [models.TextqlRpcPublicOntologyOntologyMetric](../models/textql-rpc-public-ontology-ontology-metric.md)[]               | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `createdObject`                                                                                                         | *models.TextqlRpcPublicOntologyOntologyObject*                                                                          | :heavy_minus_sign:                                                                                                      | Ontology entities                                                                                                       |
| `createdAttributes`                                                                                                     | [models.TextqlRpcPublicOntologyOntologyAttribute](../models/textql-rpc-public-ontology-ontology-attribute.md)[]         | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `updatedObject`                                                                                                         | *models.TextqlRpcPublicOntologyOntologyObject*                                                                          | :heavy_minus_sign:                                                                                                      | Ontology entities                                                                                                       |
| `deletedObject`                                                                                                         | *models.TextqlRpcPublicOntologyOntologyObject*                                                                          | :heavy_minus_sign:                                                                                                      | Ontology entities                                                                                                       |
| `createdAttribute`                                                                                                      | [models.TextqlRpcPublicOntologyOntologyAttribute](../models/textql-rpc-public-ontology-ontology-attribute.md)           | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `updatedAttribute`                                                                                                      | [models.TextqlRpcPublicOntologyOntologyAttribute](../models/textql-rpc-public-ontology-ontology-attribute.md)           | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `deletedAttribute`                                                                                                      | [models.TextqlRpcPublicOntologyOntologyAttribute](../models/textql-rpc-public-ontology-ontology-attribute.md)           | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `createdLink`                                                                                                           | [models.TextqlRpcPublicOntologyOntologyRelation](../models/textql-rpc-public-ontology-ontology-relation.md)             | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `updatedLink`                                                                                                           | [models.TextqlRpcPublicOntologyOntologyRelation](../models/textql-rpc-public-ontology-ontology-relation.md)             | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `deletedLink`                                                                                                           | [models.TextqlRpcPublicOntologyOntologyRelation](../models/textql-rpc-public-ontology-ontology-relation.md)             | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `createdMetric`                                                                                                         | [models.TextqlRpcPublicOntologyOntologyMetric](../models/textql-rpc-public-ontology-ontology-metric.md)                 | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `updatedMetric`                                                                                                         | [models.TextqlRpcPublicOntologyOntologyMetric](../models/textql-rpc-public-ontology-ontology-metric.md)                 | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |
| `deletedMetric`                                                                                                         | [models.TextqlRpcPublicOntologyOntologyMetric](../models/textql-rpc-public-ontology-ontology-metric.md)                 | :heavy_minus_sign:                                                                                                      | N/A                                                                                                                     |