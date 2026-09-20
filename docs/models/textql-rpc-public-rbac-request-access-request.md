# TextqlRpcPublicRbacRequestAccessRequest

Access request management messages

## Example Usage

```typescript
import { TextqlRpcPublicRbacRequestAccessRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacRequestAccessRequest = {};
```

## Fields

| Field                 | Type                  | Required              | Description           |
| --------------------- | --------------------- | --------------------- | --------------------- |
| `objectType`          | *string*              | :heavy_minus_sign:    | N/A                   |
| `objectId`            | *string*              | :heavy_minus_sign:    | N/A                   |
| `requestedAccessType` | *string*              | :heavy_minus_sign:    | owner, editor, viewer |
| `justification`       | *string*              | :heavy_minus_sign:    | N/A                   |
| `requestMessage`      | *string*              | :heavy_minus_sign:    | N/A                   |