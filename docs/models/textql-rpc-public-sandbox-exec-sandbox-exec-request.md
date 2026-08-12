# TextqlRpcPublicSandboxExecSandboxExecRequest

## Example Usage

```typescript
import { TextqlRpcPublicSandboxExecSandboxExecRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicSandboxExecSandboxExecRequest = {};
```

## Fields

| Field                                          | Type                                           | Required                                       | Description                                    |
| ---------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `sandboxId`                                    | *string*                                       | :heavy_minus_sign:                             | N/A                                            |
| `command`                                      | *string*                                       | :heavy_minus_sign:                             | N/A                                            |
| `kind`                                         | *string*                                       | :heavy_minus_sign:                             | "" \| "bash" \| "sh" \| "shell" \| "python" \| "py" |
| `env`                                          | Record<string, *string*>                       | :heavy_minus_sign:                             | N/A                                            |