# TextqlRpcPublicSlackListInstallationsResponse

List all Slack workspace installations for the organization

## Example Usage

```typescript
import { TextqlRpcPublicSlackListInstallationsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicSlackListInstallationsResponse = {
  installations: [
    {
      createdAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

## Fields

| Field                                                                                          | Type                                                                                           | Required                                                                                       | Description                                                                                    |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `installations`                                                                                | [models.TextqlRpcPublicSlackInstallation](../models/textql-rpc-public-slack-installation.md)[] | :heavy_minus_sign:                                                                             | N/A                                                                                            |