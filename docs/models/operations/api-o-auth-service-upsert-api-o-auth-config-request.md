# ApiOAuthServiceUpsertApiOAuthConfigRequest

## Example Usage

```typescript
import { ApiOAuthServiceUpsertApiOAuthConfigRequest } from "@textql/sdk/models/operations";

let value: ApiOAuthServiceUpsertApiOAuthConfigRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                                     | Type                                                                                                                                      | Required                                                                                                                                  | Description                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                                  | *"1"*                                                                                                                                     | :heavy_check_mark:                                                                                                                        | Define the version of the Connect protocol                                                                                                |
| `connectTimeoutMs`                                                                                                                        | *number*                                                                                                                                  | :heavy_minus_sign:                                                                                                                        | N/A                                                                                                                                       |
| `body`                                                                                                                                    | [models.TextqlRpcPublicApiOauthUpsertApiOAuthConfigRequest](../../models/textql-rpc-public-api-oauth-upsert-api-o-auth-config-request.md) | :heavy_check_mark:                                                                                                                        | N/A                                                                                                                                       |