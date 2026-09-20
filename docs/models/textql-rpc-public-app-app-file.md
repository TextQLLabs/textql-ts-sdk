# TextqlRpcPublicAppAppFile

AppFile is one non-entry file of a multi-file app tree; code remains the entry index.html.

## Example Usage

```typescript
import { TextqlRpcPublicAppAppFile } from "@textql/sdk/models";

let value: TextqlRpcPublicAppAppFile = {};
```

## Fields

| Field                                                         | Type                                                          | Required                                                      | Description                                                   |
| ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| `path`                                                        | *string*                                                      | :heavy_minus_sign:                                            | normalized relative path, forward slashes, no .. or leading / |
| `content`                                                     | *string*                                                      | :heavy_minus_sign:                                            | N/A                                                           |