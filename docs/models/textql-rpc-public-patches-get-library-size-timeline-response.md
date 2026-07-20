# TextqlRpcPublicPatchesGetLibrarySizeTimelineResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesGetLibrarySizeTimelineResponse } from "textql-sdk/models";

let value: TextqlRpcPublicPatchesGetLibrarySizeTimelineResponse = {};
```

## Fields

| Field                                                                                                                                         | Type                                                                                                                                          | Required                                                                                                                                      | Description                                                                                                                                   |
| --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `days`                                                                                                                                        | [models.TextqlRpcPublicPatchesLibrarySizeDay](../models/textql-rpc-public-patches-library-size-day.md)[]                                      | :heavy_minus_sign:                                                                                                                            | one entry per UTC day, oldest first; days before the repo's first commit<br/> are omitted, and days without commits carry the previous day's tree |