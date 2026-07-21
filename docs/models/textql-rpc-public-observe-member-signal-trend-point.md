# TextqlRpcPublicObserveMemberSignalTrendPoint

One (member, week) bucket of signal quality. Weeks with no signals and no
 analyzed threads are omitted; the client zero-fills the axis.

## Example Usage

```typescript
import { TextqlRpcPublicObserveMemberSignalTrendPoint } from "@textql/sdk/models";

let value: TextqlRpcPublicObserveMemberSignalTrendPoint = {};
```

## Fields

| Field                                   | Type                                    | Required                                | Description                             |
| --------------------------------------- | --------------------------------------- | --------------------------------------- | --------------------------------------- |
| `memberId`                              | *string*                                | :heavy_minus_sign:                      | N/A                                     |
| `bucketStart`                           | *string*                                | :heavy_minus_sign:                      | YYYY-MM-DD, week start                  |
| `positive`                              | *number*                                | :heavy_minus_sign:                      | N/A                                     |
| `negative`                              | *number*                                | :heavy_minus_sign:                      | N/A                                     |
| `analyzed`                              | *number*                                | :heavy_minus_sign:                      | distinct analyzed threads in the bucket |