# TextqlRpcPublicAppGetAppVersionRequest

## Example Usage

```typescript
import { TextqlRpcPublicAppGetAppVersionRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicAppGetAppVersionRequest = {};
```

## Fields

| Field                                                                             | Type                                                                              | Required                                                                          | Description                                                                       |
| --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `appId`                                                                           | *string*                                                                          | :heavy_minus_sign:                                                                | False when the document predates tree publishing and has no runtime to overwrite. |
| `versionNumber`                                                                   | *number*                                                                          | :heavy_minus_sign:                                                                | N/A                                                                               |
| `commitId`                                                                        | *string*                                                                          | :heavy_minus_sign:                                                                | N/A                                                                               |