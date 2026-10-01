# TextqlRpcPublicApiOauthExchangeApiOAuthCodeRequest

## Example Usage

```typescript
import { TextqlRpcPublicApiOauthExchangeApiOAuthCodeRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicApiOauthExchangeApiOAuthCodeRequest = {};
```

## Fields

| Field                                                                                            | Type                                                                                             | Required                                                                                         | Description                                                                                      |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `ref`                                                                                            | [models.TextqlRpcPublicSecretApiAccessRef](../models/textql-rpc-public-secret-api-access-ref.md) | :heavy_minus_sign:                                                                               | N/A                                                                                              |
| `code`                                                                                           | *string*                                                                                         | :heavy_minus_sign:                                                                               | N/A                                                                                              |
| `state`                                                                                          | *string*                                                                                         | :heavy_minus_sign:                                                                               | N/A                                                                                              |
| `codeVerifier`                                                                                   | *string*                                                                                         | :heavy_minus_sign:                                                                               | N/A                                                                                              |
| `redirectUri`                                                                                    | *string*                                                                                         | :heavy_minus_sign:                                                                               | Must match the redirect_uri used in GetApiOAuthURL. Omit for the UI callback.                    |