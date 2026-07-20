# TextqlRpcPublicPatchesSkill

Skill is the display metadata for one library skill. Intentionally carries no
 instruction body: bodies are inlined server-side at chat time and never sent
 to the client.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesSkill } from "textql-sdk/models";

let value: TextqlRpcPublicPatchesSkill = {};
```

## Fields

| Field                                            | Type                                             | Required                                         | Description                                      |
| ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------ |
| `trigger`                                        | *string*                                         | :heavy_minus_sign:                               | directory basename — the /<trigger> a user types |
| `name`                                           | *string*                                         | :heavy_minus_sign:                               | frontmatter display name (may be empty)          |
| `description`                                    | *string*                                         | :heavy_minus_sign:                               | frontmatter description (may be empty)           |
| `path`                                           | *string*                                         | :heavy_minus_sign:                               | library-relative path, e.g. "skills/forecast"    |