# TextqlRpcPublicDashboardPreviewConfigDashboardRequest

PreviewConfigDashboard renders a config-managed dashboard from a patch ref before
 merge (ADR-0022). The previewing member + org come from auth context.

## Example Usage

```typescript
import { TextqlRpcPublicDashboardPreviewConfigDashboardRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicDashboardPreviewConfigDashboardRequest = {};
```

## Fields

| Field                                | Type                                 | Required                             | Description                          |
| ------------------------------------ | ------------------------------------ | ------------------------------------ | ------------------------------------ |
| `patchRef`                           | *string*                             | :heavy_minus_sign:                   | git ref of the patch to preview from |
| `dashboardPath`                      | *string*                             | :heavy_minus_sign:                   | Library path of the .dashboard file  |