# TextqlRpcPublicDashboardSpawnDashboardRequest

## Example Usage

```typescript
import { TextqlRpcPublicDashboardSpawnDashboardRequest } from "textql-sdk/models";

let value: TextqlRpcPublicDashboardSpawnDashboardRequest = {};
```

## Fields

| Field                                                                         | Type                                                                          | Required                                                                      | Description                                                                   |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `dashboardId`                                                                 | *string*                                                                      | :heavy_minus_sign:                                                            | N/A                                                                           |
| `forceRestart`                                                                | *boolean*                                                                     | :heavy_minus_sign:                                                            | Force restart even if already running                                         |
| `refreshDataOnly`                                                             | *boolean*                                                                     | :heavy_minus_sign:                                                            | Re-fetch data sources and reload without restarting the app                   |
| `refreshSourceNames`                                                          | *string*[]                                                                    | :heavy_minus_sign:                                                            | If non-empty with refresh_data_only, only refresh these sources by name       |
| `refreshCodeOnly`                                                             | *boolean*                                                                     | :heavy_minus_sign:                                                            | Update code in-place via Streamlit's runOnSave without restarting the process |