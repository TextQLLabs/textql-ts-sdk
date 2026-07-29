# TextqlRpcPublicSandboxCapabilitySandboxStartAskResponse

ask_id is "chat:<chat_id>" for base-agent asks, "agent:<task_id>" for named-agent runs.

## Example Usage

```typescript
import { TextqlRpcPublicSandboxCapabilitySandboxStartAskResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicSandboxCapabilitySandboxStartAskResponse = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `askId`            | *string*           | :heavy_minus_sign: | N/A                |
| `chatId`           | *string*           | :heavy_minus_sign: | N/A                |
| `chatUrl`          | *string*           | :heavy_minus_sign: | N/A                |
| `cursor`           | *string*           | :heavy_minus_sign: | N/A                |
| `error`            | *string*           | :heavy_minus_sign: | N/A                |
| `refreshedToken`   | *string*           | :heavy_minus_sign: | N/A                |