# TextqlRpcPublicAppListMyAppMemberActivityRequest

## Example Usage

```typescript
import { TextqlRpcPublicAppListMyAppMemberActivityRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppListMyAppMemberActivityRequest = {};
```

## Fields

| Field                                   | Type                                    | Required                                | Description                             |
| --------------------------------------- | --------------------------------------- | --------------------------------------- | --------------------------------------- |
| `appId`                                 | *string*                                | :heavy_minus_sign:                      | N/A                                     |
| `type`                                  | *string*                                | :heavy_minus_sign:                      | N/A                                     |
| `limit`                                 | *number*                                | :heavy_minus_sign:                      | server clamps to 200; <=0 means default |