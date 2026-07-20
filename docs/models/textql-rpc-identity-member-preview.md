# TextqlRpcIdentityMemberPreview

## Example Usage

```typescript
import { TextqlRpcIdentityMemberPreview } from "@textql/sdk/models";

let value: TextqlRpcIdentityMemberPreview = {};
```

## Fields

| Field                                                                                                                           | Type                                                                                                                            | Required                                                                                                                        | Description                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `memberId`                                                                                                                      | *string*                                                                                                                        | :heavy_minus_sign:                                                                                                              | N/A                                                                                                                             |
| `memberEmail`                                                                                                                   | *string*                                                                                                                        | :heavy_minus_sign:                                                                                                              | the fields are optionally populated, depending on the context<br/> may require RPC fields such as `include_owner` to be set to true |
| `memberName`                                                                                                                    | *string*                                                                                                                        | :heavy_minus_sign:                                                                                                              | N/A                                                                                                                             |
| `memberPictureUrl`                                                                                                              | *string*                                                                                                                        | :heavy_minus_sign:                                                                                                              | N/A                                                                                                                             |