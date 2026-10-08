# ApiOAuthServicePollDeviceCodeTokenRequest

## Example Usage

```typescript
import { ApiOAuthServicePollDeviceCodeTokenRequest } from "@textql/sdk/models/operations";

let value: ApiOAuthServicePollDeviceCodeTokenRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                                  | Type                                                                                                                                   | Required                                                                                                                               | Description                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                                               | *"1"*                                                                                                                                  | :heavy_check_mark:                                                                                                                     | Define the version of the Connect protocol                                                                                             |
| `connectTimeoutMs`                                                                                                                     | *number*                                                                                                                               | :heavy_minus_sign:                                                                                                                     | N/A                                                                                                                                    |
| `body`                                                                                                                                 | [models.TextqlRpcPublicApiOauthPollDeviceCodeTokenRequest](../../models/textql-rpc-public-api-oauth-poll-device-code-token-request.md) | :heavy_check_mark:                                                                                                                     | N/A                                                                                                                                    |