# HarnessServiceListHarnessesRequest

## Example Usage

```typescript
import { HarnessServiceListHarnessesRequest } from "@textql/sdk/models/operations";

let value: HarnessServiceListHarnessesRequest = {
  body: {},
};
```

## Fields

| Field                                                                                                                 | Type                                                                                                                  | Required                                                                                                              | Description                                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `connectProtocolVersion`                                                                                              | *"1"*                                                                                                                 | :heavy_check_mark:                                                                                                    | Define the version of the Connect protocol                                                                            |
| `connectTimeoutMs`                                                                                                    | *number*                                                                                                              | :heavy_minus_sign:                                                                                                    | N/A                                                                                                                   |
| `body`                                                                                                                | [models.TextqlRpcPublicHarnessListHarnessesRequest](../../models/textql-rpc-public-harness-list-harnesses-request.md) | :heavy_check_mark:                                                                                                    | N/A                                                                                                                   |