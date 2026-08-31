# TextqlRpcPublicCellsOntologyQueryCell

UseSkillCell is the client projection of a `use_skill` auto-invoke. It
 deliberately carries no body field: the skill's instructions are LLM-facing
 prompt scaffolding (see compute/pkg/chat/cells/use_skill.go), never sent to
 the transcript. The frontend renders provenance only ("Using skill /trigger").

## Example Usage

```typescript
import { TextqlRpcPublicCellsOntologyQueryCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsOntologyQueryCell = {
  dataframe: {
    df: {
      records: [
        {
          columns: [
            {
              int32: {},
            },
          ],
        },
      ],
    },
  },
};
```

## Fields

| Field                                                                                                             | Type                                                                                                              | Required                                                                                                          | Description                                                                                                       |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `action`                                                                                                          | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `path`                                                                                                            | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `paramsJson`                                                                                                      | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `connectorId`                                                                                                     | *number*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `declaredParams`                                                                                                  | [models.TextqlRpcPublicCellsOntologyQueryParam](../models/textql-rpc-public-cells-ontology-query-param.md)[]      | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `sql`                                                                                                             | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `usedConnectorId`                                                                                                 | *number*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `dataframe`                                                                                                       | [models.TextqlRpcPublicDataframeDataFrameWithInfo](../models/textql-rpc-public-dataframe-data-frame-with-info.md) | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `dataframePreview`                                                                                                | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authRequired`                                                                                                    | *boolean*                                                                                                         | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authConnectorName`                                                                                               | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authLocator`                                                                                                     | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authClientId`                                                                                                    | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authRole`                                                                                                        | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authCompleted`                                                                                                   | *boolean*                                                                                                         | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authConnectorType`                                                                                               | [models.TextqlRpcPublicConnectorConnectorType](../models/textql-rpc-public-connector-connector-type.md)           | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |
| `authWorkspaceUrl`                                                                                                | *string*                                                                                                          | :heavy_minus_sign:                                                                                                | N/A                                                                                                               |