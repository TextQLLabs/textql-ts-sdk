# TextqlRpcPublicCellsEmailRecipient

ConnectorsCell is the agent-only "connectors" inspect tool. The frontend only
 shows that the tool ran (and a count); connector detail goes to the LLM, never
 to the browser, and never carries secrets.

## Example Usage

```typescript
import { TextqlRpcPublicCellsEmailRecipient } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsEmailRecipient = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `address`          | *string*           | :heavy_minus_sign: | list \| get        |
| `class`            | *string*           | :heavy_minus_sign: | N/A                |
| `memberId`         | *string*           | :heavy_minus_sign: | N/A                |
| `displayName`      | *string*           | :heavy_minus_sign: | N/A                |