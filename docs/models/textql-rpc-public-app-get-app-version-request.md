# TextqlRpcPublicAppGetAppVersionRequest

Version history entry. Git-backed apps derive one per library commit (published_by/at
 carry the commit author/time); legacy rows are pre-existing publish-era snapshots.

## Example Usage

```typescript
import { TextqlRpcPublicAppGetAppVersionRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppGetAppVersionRequest = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `appId`            | *string*           | :heavy_minus_sign: | N/A                |
| `versionNumber`    | *number*           | :heavy_minus_sign: | N/A                |
| `commitId`         | *string*           | :heavy_minus_sign: | N/A                |