# TextqlRpcPublicCellsUseSkillCell

UseSkillCell is the client projection of a `use_skill` auto-invoke. It
 deliberately carries no body field: the skill's instructions are LLM-facing
 prompt scaffolding (see compute/pkg/chat/cells/use_skill.go), never sent to
 the transcript. The frontend renders provenance only ("Using skill /trigger").

## Example Usage

```typescript
import { TextqlRpcPublicCellsUseSkillCell } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsUseSkillCell = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `trigger`          | *string*           | :heavy_minus_sign: | N/A                |
| `name`             | *string*           | :heavy_minus_sign: | N/A                |
| `ok`               | *boolean*          | :heavy_minus_sign: | N/A                |