# TextqlRpcPublicAppListAppActivitySinceRequest

## Example Usage

```typescript
import { TextqlRpcPublicAppListAppActivitySinceRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppListAppActivitySinceRequest = {};
```

## Fields

| Field                                   | Type                                    | Required                                | Description                             |
| --------------------------------------- | --------------------------------------- | --------------------------------------- | --------------------------------------- |
| `appId`                                 | *string*                                | :heavy_minus_sign:                      | N/A                                     |
| `scope`                                 | *string*                                | :heavy_minus_sign:                      | N/A                                     |
| `afterSeq`                              | *models.AfterSeq*                       | :heavy_minus_sign:                      | N/A                                     |
| `limit`                                 | *number*                                | :heavy_minus_sign:                      | server clamps to 200; <=0 means default |