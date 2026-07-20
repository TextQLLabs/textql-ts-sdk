# TextqlRpcPublicCellsEmailRecipient

EmailRecipient is one resolved recipient of an EmailCell. The frontend
 renders these as chips; the backend uses the resolution to enforce the
 internal-only policy at cell creation time.

## Example Usage

```typescript
import { TextqlRpcPublicCellsEmailRecipient } from "textql-sdk/models";

let value: TextqlRpcPublicCellsEmailRecipient = {};
```

## Fields

| Field                              | Type                               | Required                           | Description                        |
| ---------------------------------- | ---------------------------------- | ---------------------------------- | ---------------------------------- |
| `address`                          | *string*                           | :heavy_minus_sign:                 | N/A                                |
| `class`                            | *string*                           | :heavy_minus_sign:                 | "internal" or "external"           |
| `memberId`                         | *string*                           | :heavy_minus_sign:                 | populated when class == "internal" |
| `displayName`                      | *string*                           | :heavy_minus_sign:                 | N/A                                |