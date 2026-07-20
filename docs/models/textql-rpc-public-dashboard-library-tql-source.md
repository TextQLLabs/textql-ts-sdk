# TextqlRpcPublicDashboardLibraryTQLSource

References a .tql file stored in the Context Library. The file is rendered
 to SQL at fetch time and executed against the provided connector. Template
 parameter values are JSON-encoded in `params_json` (e.g. {"region":"EU"}).

## Example Usage

```typescript
import { TextqlRpcPublicDashboardLibraryTQLSource } from "@textql/sdk/models";

let value: TextqlRpcPublicDashboardLibraryTQLSource = {};
```

## Fields

| Field                                                             | Type                                                              | Required                                                          | Description                                                       |
| ----------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------- |
| `tqlPath`                                                         | *string*                                                          | :heavy_minus_sign:                                                | path to the .tql file in the Context Library (must end in .tql)   |
| `connectorId`                                                     | *number*                                                          | :heavy_minus_sign:                                                | SQL connector to execute the rendered query against               |
| `paramsJson`                                                      | *string*                                                          | :heavy_minus_sign:                                                | JSON object mapping parameter names to values; "" means no params |