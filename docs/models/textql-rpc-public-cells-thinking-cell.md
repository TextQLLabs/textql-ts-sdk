# TextqlRpcPublicCellsThinkingCell

## Example Usage

```typescript
import { TextqlRpcPublicCellsThinkingCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsThinkingCell = {};
```

## Fields

| Field                                                  | Type                                                   | Required                                               | Description                                            |
| ------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------ | ------------------------------------------------------ |
| `content`                                              | *string*                                               | :heavy_minus_sign:                                     | summarized thinking text; empty for redacted blocks    |
| `redacted`                                             | *boolean*                                              | :heavy_minus_sign:                                     | provider returned an encrypted redacted_thinking block |