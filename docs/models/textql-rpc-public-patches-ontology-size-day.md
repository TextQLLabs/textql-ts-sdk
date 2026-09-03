# TextqlRpcPublicPatchesOntologySizeDay

copied from google.type.Date; not available in buf's google/protobuf/*

## Example Usage

```typescript
import { TextqlRpcPublicPatchesOntologySizeDay } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesOntologySizeDay = {};
```

## Fields

| Field                                                                                                                                                          | Type                                                                                                                                                           | Required                                                                                                                                                       | Description                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `date`                                                                                                                                                         | [models.TextqlRpcPublicPatchesDate](../models/textql-rpc-public-patches-date.md)                                                                               | :heavy_minus_sign:                                                                                                                                             | N/A                                                                                                                                                            |
| `totalBytes`                                                                                                                                                   | *models.TotalBytes*                                                                                                                                            | :heavy_minus_sign:                                                                                                                                             | Month of a year. Must be from 1 to 12, or 0 to specify a year without a<br/> month and day.                                                                    |
| `fileCount`                                                                                                                                                    | *number*                                                                                                                                                       | :heavy_minus_sign:                                                                                                                                             | Day of a month. Must be from 1 to 31 and valid for the year and month, or 0<br/> to specify a year by itself or a year and month where the day isn't<br/> significant. |