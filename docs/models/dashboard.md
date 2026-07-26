# Dashboard

## Example Usage

```typescript
import { Dashboard } from "@textql/sdk/models";

let value: Dashboard = {
  dashboard: {},
};
```

## Fields

| Field                                                                                                          | Type                                                                                                           | Required                                                                                                       | Description                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `dashboard`                                                                                                    | [models.TextqlRpcPublicChatDashboardArtifactData](../models/textql-rpc-public-chat-dashboard-artifact-data.md) | :heavy_check_mark:                                                                                             | File-based artifacts (images, PDFs, CSVs, HTML, text files)                                                    |
| `id`                                                                                                           | *string*                                                                                                       | :heavy_minus_sign:                                                                                             | Flat list, sorted by created_at DESC                                                                           |
| `name`                                                                                                         | *string*                                                                                                       | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |