# ApiOAuthServiceGetApiOAuthStatusRequest

## Example Usage

```typescript
import { ApiOAuthServiceGetApiOAuthStatusRequest } from "@textql/sdk/models/operations";

let value: ApiOAuthServiceGetApiOAuthStatusRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                               | Type                                                                                                                                | Required                                                                                                                            | Description                                                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                            | *"1"*                                                                                                                               | :heavy_check_mark:                                                                                                                  | Define the version of the Connect protocol                                                                                          |
| `connectTimeoutMs`                                                                                                                  | *number*                                                                                                                            | :heavy_minus_sign:                                                                                                                  | N/A                                                                                                                                 |
| `body`                                                                                                                              | [models.TextqlRpcPublicApiOauthGetApiOAuthStatusRequest](../../models/textql-rpc-public-api-oauth-get-api-o-auth-status-request.md) | :heavy_check_mark:                                                                                                                  | N/A                                                                                                                                 |