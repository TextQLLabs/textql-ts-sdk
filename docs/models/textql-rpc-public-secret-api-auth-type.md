# TextqlRpcPublicSecretApiAuthType

Authentication mode for an API connector. Provider templates have a separate
 auth_type describing how their credentials are entered (e.g. basic_auth).
 OAUTH_U2M shares one OAuth account among members with connector access;
 OAUTH_PER_MEMBER requires each member to connect their own account.

## Example Usage

```typescript
import { TextqlRpcPublicSecretApiAuthType } from "@textql/sdk/models";

let value: TextqlRpcPublicSecretApiAuthType = "API_AUTH_TYPE_TOKEN";

// Open enum: unrecognized values are captured as Unrecognized<string>
```

## Values

```typescript
"API_AUTH_TYPE_UNSPECIFIED" | "API_AUTH_TYPE_TOKEN" | "API_AUTH_TYPE_OAUTH_U2M" | "API_AUTH_TYPE_OAUTH_PER_MEMBER" | "API_AUTH_TYPE_ENV_VAR" | "API_AUTH_TYPE_NONE" | "API_AUTH_TYPE_OTHER" | Unrecognized<string>
```