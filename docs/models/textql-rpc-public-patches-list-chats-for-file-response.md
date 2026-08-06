# TextqlRpcPublicPatchesListChatsForFileResponse

Aggregate ontology-usage health for the window — the roll-ups the Ontology
 Health hero needs without paging every file to the client. pulled_files,
 avg_hit_rate, and error_files are Postgres aggregates over the pull/run data;
 total_files, dead_files, and reclaimable_tokens come from the current git
 tree diffed against the set of pulled paths (a dead file is one present in
 the ontology but never pulled in the window).

## Example Usage

```typescript
import { TextqlRpcPublicPatchesListChatsForFileResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesListChatsForFileResponse = {
  chats: [
    {
      lastPulled: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                  | Type                                                                                                   | Required                                                                                               | Description                                                                                            |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `chats`                                                                                                | [models.TextqlRpcPublicPatchesFileChatUsage](../models/textql-rpc-public-patches-file-chat-usage.md)[] | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |