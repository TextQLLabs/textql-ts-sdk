# TextqlRpcPublicObserveMemberBillingStat

## Example Usage

```typescript
import { TextqlRpcPublicObserveMemberBillingStat } from "@textql/sdk/models";

let value: TextqlRpcPublicObserveMemberBillingStat = {};
```

## Fields

| Field                                     | Type                                      | Required                                  | Description                               |
| ----------------------------------------- | ----------------------------------------- | ----------------------------------------- | ----------------------------------------- |
| `memberId`                                | *string*                                  | :heavy_minus_sign:                        | N/A                                       |
| `memberName`                              | *string*                                  | :heavy_minus_sign:                        | N/A                                       |
| `email`                                   | *string*                                  | :heavy_minus_sign:                        | N/A                                       |
| `totalAcu`                                | *number*                                  | :heavy_minus_sign:                        | N/A                                       |
| `acuByCategory`                           | Record<string, *number*>                  | :heavy_minus_sign:                        | llm_tokens, compute_hours, cell_execution |
| `acuBySource`                             | Record<string, *number*>                  | :heavy_minus_sign:                        | chat, feed, observability                 |
| `profileImageUrl`                         | *string*                                  | :heavy_minus_sign:                        | N/A                                       |
| `threadCount`                             | *number*                                  | :heavy_minus_sign:                        | N/A                                       |
| `playbookCount`                           | *number*                                  | :heavy_minus_sign:                        | N/A                                       |
| `dashboardCount`                          | *number*                                  | :heavy_minus_sign:                        | N/A                                       |
| `agentCount`                              | *number*                                  | :heavy_minus_sign:                        | N/A                                       |
| `isFormerMember`                          | *boolean*                                 | :heavy_minus_sign:                        | N/A                                       |