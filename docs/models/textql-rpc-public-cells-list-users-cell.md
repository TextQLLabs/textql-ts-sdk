# TextqlRpcPublicCellsListUsersCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsListUsersCell } from "textql-sdk/models";

let value: TextqlRpcPublicCellsListUsersCell = {};
```

## Fields

| Field                                                                                     | Type                                                                                      | Required                                                                                  | Description                                                                               |
| ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `searchTerm`                                                                              | *string*                                                                                  | :heavy_minus_sign:                                                                        | N/A                                                                                       |
| `userType`                                                                                | *string*                                                                                  | :heavy_minus_sign:                                                                        | "all", "bots", or "humans"                                                                |
| `totalCount`                                                                              | *number*                                                                                  | :heavy_minus_sign:                                                                        | N/A                                                                                       |
| `sandboxAvailable`                                                                        | *boolean*                                                                                 | :heavy_minus_sign:                                                                        | N/A                                                                                       |
| `errorMessage`                                                                            | *string*                                                                                  | :heavy_minus_sign:                                                                        | N/A                                                                                       |
| `agents`                                                                                  | [models.TextqlRpcPublicCellsAgentInfo](../models/textql-rpc-public-cells-agent-info.md)[] | :heavy_minus_sign:                                                                        | N/A                                                                                       |