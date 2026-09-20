# TextqlRpcPublicAppVerifyAppRenderResponse

## Example Usage

```typescript
import { TextqlRpcPublicAppVerifyAppRenderResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicAppVerifyAppRenderResponse = {};
```

## Fields

| Field                                                                                            | Type                                                                                             | Required                                                                                         | Description                                                                                      |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `ready`                                                                                          | *boolean*                                                                                        | :heavy_minus_sign:                                                                               | true only when rendering succeeded, produced a screenshot, and logged no browser errors/warnings |
| `screenshotUrl`                                                                                  | *string*                                                                                         | :heavy_minus_sign:                                                                               | N/A                                                                                              |
| `consoleErrors`                                                                                  | *string*[]                                                                                       | :heavy_minus_sign:                                                                               | N/A                                                                                              |
| `renderError`                                                                                    | *string*                                                                                         | :heavy_minus_sign:                                                                               | renderer/infrastructure failure; browser diagnostics stay in console_errors                      |