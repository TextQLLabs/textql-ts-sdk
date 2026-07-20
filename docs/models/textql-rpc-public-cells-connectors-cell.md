# TextqlRpcPublicCellsConnectorsCell

ConnectorsCell is the agent-only "connectors" inspect tool. The frontend only
 shows that the tool ran (and a count); connector detail goes to the LLM, never
 to the browser, and never carries secrets.

## Example Usage

```typescript
import { TextqlRpcPublicCellsConnectorsCell } from "textql-sdk/models";

let value: TextqlRpcPublicCellsConnectorsCell = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `action`           | *string*           | :heavy_minus_sign: | list \| get        |
| `totalCount`       | *number*           | :heavy_minus_sign: | N/A                |