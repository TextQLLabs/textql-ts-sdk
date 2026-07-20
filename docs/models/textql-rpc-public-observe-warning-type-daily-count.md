# TextqlRpcPublicObserveWarningTypeDailyCount

WarningTypeDailyCount is one (day, warning type) bucket for the warning
 breakdown-over-time chart. Derived from thread_warning joined to each chat's
 created_at.

## Example Usage

```typescript
import { TextqlRpcPublicObserveWarningTypeDailyCount } from "@textql/sdk/models";

let value: TextqlRpcPublicObserveWarningTypeDailyCount = {};
```

## Fields

| Field                                                                                                  | Type                                                                                                   | Required                                                                                               | Description                                                                                            |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| `date`                                                                                                 | *string*                                                                                               | :heavy_minus_sign:                                                                                     | YYYY-MM-DD                                                                                             |
| `warningType`                                                                                          | [models.TextqlRpcPublicChatThreadWarningType](../models/textql-rpc-public-chat-thread-warning-type.md) | :heavy_minus_sign:                                                                                     | ThreadWarningType is the canonical set of thread warning types                                         |
| `total`                                                                                                | *number*                                                                                               | :heavy_minus_sign:                                                                                     | N/A                                                                                                    |