# TextqlRpcPublicAppSetFavoriteRequest

A named Data App design system: the file tree is the source of truth, the
 token fields mirror theme.json ("" = brand/default). All fields server-owned.

## Example Usage

```typescript
import { TextqlRpcPublicAppSetFavoriteRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppSetFavoriteRequest = {};
```

## Fields

| Field                     | Type                      | Required                  | Description               |
| ------------------------- | ------------------------- | ------------------------- | ------------------------- |
| `primitiveType`           | *string*                  | :heavy_minus_sign:        | N/A                       |
| `primitiveId`             | *string*                  | :heavy_minus_sign:        | N/A                       |
| `favorited`               | *boolean*                 | :heavy_minus_sign:        | "" = brand/default accent |