# TextqlRpcPublicSandboxCapabilitySandboxStartAskRequest

## Example Usage

```typescript
import { TextqlRpcPublicSandboxCapabilitySandboxStartAskRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicSandboxCapabilitySandboxStartAskRequest = {};
```

## Fields

| Field                                                                          | Type                                                                           | Required                                                                       | Description                                                                    |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------ |
| `name`                                                                         | *string*                                                                       | :heavy_minus_sign:                                                             | N/A                                                                            |
| `agentId`                                                                      | *string*                                                                       | :heavy_minus_sign:                                                             | N/A                                                                            |
| `prompt`                                                                       | *string*                                                                       | :heavy_minus_sign:                                                             | N/A                                                                            |
| `appDb`                                                                        | *string*                                                                       | :heavy_minus_sign:                                                             | N/A                                                                            |
| `continueAskId`                                                                | *string*                                                                       | :heavy_minus_sign:                                                             | ask id of an earlier base-agent ask to follow up in; empty starts a new thread |