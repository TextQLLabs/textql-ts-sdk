# TextqlRpcPublicPatchesListPatchReviewersResponse

## Example Usage

```typescript
import { TextqlRpcPublicPatchesListPatchReviewersResponse } from "textql-sdk/models";

let value: TextqlRpcPublicPatchesListPatchReviewersResponse = {};
```

## Fields

| Field                                                                                                 | Type                                                                                                  | Required                                                                                              | Description                                                                                           |
| ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `reviewers`                                                                                           | [models.TextqlRpcPublicPatchesPatchReviewer](../models/textql-rpc-public-patches-patch-reviewer.md)[] | :heavy_minus_sign:                                                                                    | Code owners first, then admins, matching the sidebar's display order.                                 |