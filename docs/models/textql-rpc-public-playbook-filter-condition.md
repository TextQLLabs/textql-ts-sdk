# TextqlRpcPublicPlaybookFilterCondition

Filter condition for template data searches

## Example Usage

```typescript
import { TextqlRpcPublicPlaybookFilterCondition } from "textql-sdk/models";

let value: TextqlRpcPublicPlaybookFilterCondition = {};
```

## Fields

| Field                                                                      | Type                                                                       | Required                                                                   | Description                                                                |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `field`                                                                    | *string*                                                                   | :heavy_minus_sign:                                                         | JSON field name                                                            |
| `operator`                                                                 | *string*                                                                   | :heavy_minus_sign:                                                         | "equals", "contains", "starts_with", "ends_with", "gt", "gte", "lt", "lte" |
| `value`                                                                    | *string*                                                                   | :heavy_minus_sign:                                                         | Value to filter by                                                         |