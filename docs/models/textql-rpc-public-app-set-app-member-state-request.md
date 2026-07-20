# TextqlRpcPublicAppSetAppMemberStateRequest

## Example Usage

```typescript
import { TextqlRpcPublicAppSetAppMemberStateRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppSetAppMemberStateRequest = {};
```

## Fields

| Field                                        | Type                                         | Required                                     | Description                                  |
| -------------------------------------------- | -------------------------------------------- | -------------------------------------------- | -------------------------------------------- |
| `appId`                                      | *string*                                     | :heavy_minus_sign:                           | N/A                                          |
| `valueJson`                                  | *string*                                     | :heavy_minus_sign:                           | whole-object JSON, last-write-wins, max 64KB |