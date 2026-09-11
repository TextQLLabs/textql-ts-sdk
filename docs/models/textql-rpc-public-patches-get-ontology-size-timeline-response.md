# TextqlRpcPublicPatchesGetOntologySizeTimelineResponse

copied from google.type.Date; not available in buf's google/protobuf/*

## Example Usage

```typescript
import { TextqlRpcPublicPatchesGetOntologySizeTimelineResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesGetOntologySizeTimelineResponse = {};
```

## Fields

| Field                                                                                                      | Type                                                                                                       | Required                                                                                                   | Description                                                                                                |
| ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `days`                                                                                                     | [models.TextqlRpcPublicPatchesOntologySizeDay](../models/textql-rpc-public-patches-ontology-size-day.md)[] | :heavy_minus_sign:                                                                                         | Year of the date. Must be from 1 to 9999, or 0 to specify a date without<br/> a year.                      |