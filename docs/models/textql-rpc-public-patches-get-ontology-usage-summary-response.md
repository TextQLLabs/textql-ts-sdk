# TextqlRpcPublicPatchesGetOntologyUsageSummaryResponse

Aggregate ontology-usage health for the window — the roll-ups the Ontology
 Health hero needs without paging every file to the client. pulled_files,
 avg_hit_rate, and error_files are Postgres aggregates over the pull/run data;
 total_files, dead_files, and reclaimable_tokens come from the current git
 tree diffed against the set of pulled paths (a dead file is one present in
 the ontology but never pulled in the window).

## Example Usage

```typescript
import { TextqlRpcPublicPatchesGetOntologyUsageSummaryResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesGetOntologyUsageSummaryResponse = {};
```

## Fields

| Field                                              | Type                                               | Required                                           | Description                                        |
| -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------- |
| `totalFiles`                                       | *number*                                           | :heavy_minus_sign:                                 | N/A                                                |
| `pulledFiles`                                      | *number*                                           | :heavy_minus_sign:                                 | N/A                                                |
| `deadFiles`                                        | *number*                                           | :heavy_minus_sign:                                 | N/A                                                |
| `avgHitRate`                                       | *number*                                           | :heavy_minus_sign:                                 | 0..1, averaged over pulled files                   |
| `errorFiles`                                       | *number*                                           | :heavy_minus_sign:                                 | files with at least one errored pull in the window |
| `reclaimableTokens`                                | *models.ReclaimableTokens*                         | :heavy_minus_sign:                                 | estimated tokens held by dead files (~size/4)      |