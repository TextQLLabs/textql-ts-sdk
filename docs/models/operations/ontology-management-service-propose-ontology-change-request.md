# OntologyManagementServiceProposeOntologyChangeRequest

## Example Usage

```typescript
import { OntologyManagementServiceProposeOntologyChangeRequest } from "@textql/sdk/models/operations";

let value: OntologyManagementServiceProposeOntologyChangeRequest = {
  body: {
    title: "<value>",
  },
};
```

## Fields

| Field                                                                                                                                  | Type                                                                                                                                   | Required                                                                                                                               | Description                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                               | *"1"*                                                                                                                                  | :heavy_check_mark:                                                                                                                     | Define the version of the Connect protocol                                                                                             |
| `connectTimeoutMs`                                                                                                                     | *number*                                                                                                                               | :heavy_minus_sign:                                                                                                                     | N/A                                                                                                                                    |
| `body`                                                                                                                                 | [models.TextqlRpcPublicPatchesProposeOntologyChangeRequest](../../models/textql-rpc-public-patches-propose-ontology-change-request.md) | :heavy_check_mark:                                                                                                                     | N/A                                                                                                                                    |