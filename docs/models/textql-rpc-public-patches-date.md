# TextqlRpcPublicPatchesDate

copied from google.type.Date; not available in buf's google/protobuf/*

## Example Usage

```typescript
import { TextqlRpcPublicPatchesDate } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesDate = {};
```

## Fields

| Field                                                                                                                                                          | Type                                                                                                                                                           | Required                                                                                                                                                       | Description                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `year`                                                                                                                                                         | *number*                                                                                                                                                       | :heavy_minus_sign:                                                                                                                                             | Year of the date. Must be from 1 to 9999, or 0 to specify a date without<br/> a year.                                                                          |
| `month`                                                                                                                                                        | *number*                                                                                                                                                       | :heavy_minus_sign:                                                                                                                                             | Month of a year. Must be from 1 to 12, or 0 to specify a year without a<br/> month and day.                                                                    |
| `day`                                                                                                                                                          | *number*                                                                                                                                                       | :heavy_minus_sign:                                                                                                                                             | Day of a month. Must be from 1 to 31 and valid for the year and month, or 0<br/> to specify a year by itself or a year and month where the day isn't<br/> significant. |