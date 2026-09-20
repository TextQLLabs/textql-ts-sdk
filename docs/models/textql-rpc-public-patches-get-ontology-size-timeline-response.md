# TextqlRpcPublicPatchesGetOntologySizeTimelineResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesGetOntologySizeTimelineResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesGetOntologySizeTimelineResponse = {};
```

## Fields

| Field                                                                                                                                         | Type                                                                                                                                          | Required                                                                                                                                      | Description                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `days`                                                                                                                                        | [models.TextqlRpcPublicPatchesOntologySizeDay](../models/textql-rpc-public-patches-ontology-size-day.md)[]                                    | :heavy_minus_sign:                                                                                                                            | one entry per UTC day, oldest first; days before the repo's first commit<br/> are omitted, and days without commits carry the previous day's tree |