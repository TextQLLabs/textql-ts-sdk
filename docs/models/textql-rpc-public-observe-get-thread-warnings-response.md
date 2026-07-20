# TextqlRpcPublicObserveGetThreadWarningsResponse

## Example Usage

```typescript
import { TextqlRpcPublicObserveGetThreadWarningsResponse } from "textql-sdk/models";

let value: TextqlRpcPublicObserveGetThreadWarningsResponse = {
  warningsByChat: {
    "key": {
      warnings: [
        {
          fixPatchCell: {
            microsoft365CalendarCell: {},
            timestamp: new Date("2023-01-15T01:30:15.01Z"),
          },
        },
      ],
    },
  },
};
```

## Fields

| Field                                                                                                                        | Type                                                                                                                         | Required                                                                                                                     | Description                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `warningsByChat`                                                                                                             | Record<string, [models.TextqlRpcPublicObserveThreadWarningList](../models/textql-rpc-public-observe-thread-warning-list.md)> | :heavy_minus_sign:                                                                                                           | N/A                                                                                                                          |
| `analyzedChatIds`                                                                                                            | *string*[]                                                                                                                   | :heavy_minus_sign:                                                                                                           | N/A                                                                                                                          |