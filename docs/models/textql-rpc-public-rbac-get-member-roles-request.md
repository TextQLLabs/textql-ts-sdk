# TextqlRpcPublicRbacGetMemberRolesRequest

## Example Usage

```typescript
import { TextqlRpcPublicRbacGetMemberRolesRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicRbacGetMemberRolesRequest = {};
```

## Fields

| Field                                                                                                                                                            | Type                                                                                                                                                             | Required                                                                                                                                                         | Description                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `memberEmails`                                                                                                                                                   | *string*[]                                                                                                                                                       | :heavy_minus_sign:                                                                                                                                               | Emails within the caller's organization; case-insensitive, with outer whitespace ignored.<br/> Merged with member_ids and deduplicated. Unknown emails are rejected. |
| `memberIds`                                                                                                                                                      | *string*[]                                                                                                                                                       | :heavy_minus_sign:                                                                                                                                               | N/A                                                                                                                                                              |