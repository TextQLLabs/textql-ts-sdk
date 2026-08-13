# TextqlRpcAuthAssetUrlExpiry

Values are the organization.asset_url_expiry column values — do not renumber.

## Example Usage

```typescript
import { TextqlRpcAuthAssetUrlExpiry } from "@textql/sdk/models";

let value: TextqlRpcAuthAssetUrlExpiry = "EXPIRY_SEVEN_DAYS";

// Open enum: unrecognized values are captured as Unrecognized<string>
```

## Values

```typescript
"EXPIRY_NONE" | "EXPIRY_ONE_DAY" | "EXPIRY_SEVEN_DAYS" | "EXPIRY_THIRTY_DAYS" | "EXPIRY_ONE_YEAR" | "EXPIRY_FIFTEEN_MINUTES" | "EXPIRY_ONE_HOUR" | "EXPIRY_SIX_HOURS" | "EXPIRY_TWELVE_HOURS" | Unrecognized<string>
```