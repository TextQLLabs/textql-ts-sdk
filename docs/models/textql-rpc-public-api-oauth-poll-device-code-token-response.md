# TextqlRpcPublicApiOauthPollDeviceCodeTokenResponse

## Example Usage

```typescript
import { TextqlRpcPublicApiOauthPollDeviceCodeTokenResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicApiOauthPollDeviceCodeTokenResponse = {};
```

## Fields

| Field                                                           | Type                                                            | Required                                                        | Description                                                     |
| --------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------------------------- |
| `status`                                                        | *string*                                                        | :heavy_minus_sign:                                              | "pending", "slow_down", "success", "expired", "denied", "error" |
| `displayName`                                                   | *string*                                                        | :heavy_minus_sign:                                              | only on "success"                                               |
| `errorDescription`                                              | *string*                                                        | :heavy_minus_sign:                                              | N/A                                                             |