# TextqlRpcPublicPatchesGetFileUsageTimelineResponse

Aggregate ontology-usage health for the window — the roll-ups the Ontology
 Health hero needs without paging every file to the client. pulled_files,
 avg_hit_rate, and error_files are Postgres aggregates over the pull/run data;
 total_files, dead_files, and reclaimable_tokens come from the current git
 tree diffed against the set of pulled paths (a dead file is one present in
 the ontology but never pulled in the window).

## Example Usage

```typescript
import { TextqlRpcPublicPatchesGetFileUsageTimelineResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesGetFileUsageTimelineResponse = {};
```

## Fields

| Field                                                                                                    | Type                                                                                                     | Required                                                                                                 | Description                                                                                              |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `days`                                                                                                   | [models.TextqlRpcPublicPatchesDailyFileUsage](../models/textql-rpc-public-patches-daily-file-usage.md)[] | :heavy_minus_sign:                                                                                       | N/A                                                                                                      |