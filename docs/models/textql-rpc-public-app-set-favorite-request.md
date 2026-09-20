# TextqlRpcPublicAppSetFavoriteRequest

## Example Usage

```typescript
import { TextqlRpcPublicAppSetFavoriteRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppSetFavoriteRequest = {};
```

## Fields

| Field                                   | Type                                    | Required                                | Description                             |
| --------------------------------------- | --------------------------------------- | --------------------------------------- | --------------------------------------- |
| `primitiveType`                         | *string*                                | :heavy_minus_sign:                      | 'app' \| 'dashboard'                    |
| `primitiveId`                           | *string*                                | :heavy_minus_sign:                      | N/A                                     |
| `favorited`                             | *boolean*                               | :heavy_minus_sign:                      | true = pin, false = unpin (hard delete) |