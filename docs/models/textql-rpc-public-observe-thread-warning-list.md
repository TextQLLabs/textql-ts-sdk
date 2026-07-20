# TextqlRpcPublicObserveThreadWarningList

## Example Usage

```typescript
import { TextqlRpcPublicObserveThreadWarningList } from "@textql/sdk/models";

let value: TextqlRpcPublicObserveThreadWarningList = {
  warnings: [
    {
      fixPatchCell: {
        microsoft365CalendarCell: {},
        timestamp: new Date("2023-01-15T01:30:15.01Z"),
      },
    },
  ],
};
```

## Fields

| Field                                                                                                 | Type                                                                                                  | Required                                                                                              | Description                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `warnings`                                                                                            | [models.TextqlRpcPublicObserveThreadWarning](../models/textql-rpc-public-observe-thread-warning.md)[] | :heavy_minus_sign:                                                                                    | N/A                                                                                                   |