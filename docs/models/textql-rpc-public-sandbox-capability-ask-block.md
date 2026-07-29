# TextqlRpcPublicSandboxCapabilityAskBlock

## Example Usage

```typescript
import { TextqlRpcPublicSandboxCapabilityAskBlock } from "@textql/sdk/models";

let value: TextqlRpcPublicSandboxCapabilityAskBlock = {};
```

## Fields

| Field                              | Type                               | Required                           | Description                        |
| ---------------------------------- | ---------------------------------- | ---------------------------------- | ---------------------------------- |
| `type`                             | *string*                           | :heavy_minus_sign:                 | markdown \| chart \| link          |
| `content`                          | *string*                           | :heavy_minus_sign:                 | markdown blocks: the markdown text |
| `url`                              | *string*                           | :heavy_minus_sign:                 | chart/link blocks                  |
| `title`                            | *string*                           | :heavy_minus_sign:                 | chart/link blocks; optional        |