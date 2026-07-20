# TextqlRpcPublicParadigmTemplateOptions

TemplateOptions configures the one-shot TYPE_TEMPLATE paradigm.

## Example Usage

```typescript
import { TextqlRpcPublicParadigmTemplateOptions } from "textql-sdk/models";

let value: TextqlRpcPublicParadigmTemplateOptions = {};
```

## Fields

| Field                                                                                                                                                                      | Type                                                                                                                                                                       | Required                                                                                                                                                                   | Description                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `captureTools`                                                                                                                                                             | *string*[]                                                                                                                                                                 | :heavy_minus_sign:                                                                                                                                                         | capture_tools selects which capture-cell tool ids the paradigm exposes to<br/> the model (e.g. "generate_example_queries"). Empty means expose every<br/> registered capture cell. |