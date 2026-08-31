# TextqlRpcPublicChatGetAutoAttachedFilesResponse

A library file injected via org auto-attach (not an explicit read_file/tql pull).

## Example Usage

```typescript
import { TextqlRpcPublicChatGetAutoAttachedFilesResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicChatGetAutoAttachedFilesResponse = {
  files: [
    {
      firstPulledAt: new Date("2023-01-15T01:30:15.01Z"),
      lastPulledAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                                                 | Type                                                                                                                  | Required                                                                                                              | Description                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `files`                                                                                                               | [models.TextqlRpcPublicChatAutoAttachedLibraryFile](../models/textql-rpc-public-chat-auto-attached-library-file.md)[] | :heavy_minus_sign:                                                                                                    | N/A                                                                                                                   |