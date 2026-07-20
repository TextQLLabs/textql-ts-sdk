# TextqlRpcPublicPlaybookSetSlackChannelContextPlaybookRequest

Associates a playbook to a Slack channel as its context playbook.

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookSetSlackChannelContextPlaybookRequest } from "textql-sdk/models";

let value: TextqlRpcPublicPlaybookSetSlackChannelContextPlaybookRequest = {};
```

## Fields

| Field                            | Type                             | Required                         | Description                      |
| -------------------------------- | -------------------------------- | -------------------------------- | -------------------------------- |
| `playbookId`                     | *string*                         | :heavy_minus_sign:               | The playbook to associate        |
| `slackChannelId`                 | *string*                         | :heavy_minus_sign:               | Slack channel ID (e.g., C123...) |