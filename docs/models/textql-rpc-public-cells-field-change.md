# TextqlRpcPublicCellsFieldChange

Represents a before/after change to a field during an update.
 Used by both PlaybookEditorCell and FeedCreateCell.

## Example Usage

```typescript
import { TextqlRpcPublicCellsFieldChange } from "textql-sdk/models";

let value: TextqlRpcPublicCellsFieldChange = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `fieldName`        | *string*           | :heavy_minus_sign: | N/A                |
| `oldValue`         | *string*           | :heavy_minus_sign: | N/A                |
| `newValue`         | *string*           | :heavy_minus_sign: | N/A                |