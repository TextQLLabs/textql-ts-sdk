# TextqlRpcPublicConfigSourceConfigSource

Config-management metadata (provenance + reconcile state) for any file-based
 object. Presence on an object ⇒ the object is config-managed.

## Example Usage

```typescript
import { TextqlRpcPublicConfigSourceConfigSource } from "@textql/sdk/models";

let value: TextqlRpcPublicConfigSourceConfigSource = {};
```

## Fields

| Field                                                                                                                 | Type                                                                                                                  | Required                                                                                                              | Description                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `filePath`                                                                                                            | *string*                                                                                                              | :heavy_minus_sign:                                                                                                    | Library file that defines the object                                                                                  |
| `syncStatus`                                                                                                          | [models.TextqlRpcPublicConfigSourceConfigSyncStatus](../models/textql-rpc-public-config-source-config-sync-status.md) | :heavy_minus_sign:                                                                                                    | N/A                                                                                                                   |
| `syncError`                                                                                                           | *string*                                                                                                              | :heavy_minus_sign:                                                                                                    | set only when sync_status = ERROR                                                                                     |
| `breakingPatchId`                                                                                                     | *string*                                                                                                              | :heavy_minus_sign:                                                                                                    | patch that drove it to ERROR (Quick Revert target)                                                                    |