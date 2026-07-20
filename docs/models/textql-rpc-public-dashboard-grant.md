# TextqlRpcPublicDashboardGrant

Grant is an author allowlist gating a data source or compute function. A viewer whose
 effective role names intersect roles, or whose member id is listed in members, may call it.
 Absent grant = org-visible (today's behavior); an empty grant object is invalid.

## Example Usage

```typescript
import { TextqlRpcPublicDashboardGrant } from "@textql/sdk/models";

let value: TextqlRpcPublicDashboardGrant = {};
```

## Fields

| Field               | Type                | Required            | Description         |
| ------------------- | ------------------- | ------------------- | ------------------- |
| `roles`             | *string*[]          | :heavy_minus_sign:  | org role names      |
| `members`           | *string*[]          | :heavy_minus_sign:  | explicit member ids |