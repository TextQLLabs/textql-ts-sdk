# TextqlRpcPublicSlackHandleSlackOAuthCallbackRequest

Handle Slack OAuth callback

## Example Usage

```typescript
import { TextqlRpcPublicSlackHandleSlackOAuthCallbackRequest } from "textql-sdk/models";

let value: TextqlRpcPublicSlackHandleSlackOAuthCallbackRequest = {};
```

## Fields

| Field                                  | Type                                   | Required                               | Description                            |
| -------------------------------------- | -------------------------------------- | -------------------------------------- | -------------------------------------- |
| `code`                                 | *string*                               | :heavy_minus_sign:                     | OAuth code from Slack                  |
| `state`                                | *string*                               | :heavy_minus_sign:                     | State containing orgId, memberId, uuid |