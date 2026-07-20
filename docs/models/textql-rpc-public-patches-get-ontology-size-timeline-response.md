# TextqlRpcPublicPatchesGetOntologySizeTimelineResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesGetOntologySizeTimelineResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesGetOntologySizeTimelineResponse = {};
```

## Fields

| Field                                                                                                      | Type                                                                                                       | Required                                                                                                   | Description                                                                                                |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `days`                                                                                                     | [models.TextqlRpcPublicPatchesOntologySizeDay](../models/textql-rpc-public-patches-ontology-size-day.md)[] | :heavy_minus_sign:                                                                                         | default 90d, capped at 365d                                                                                |