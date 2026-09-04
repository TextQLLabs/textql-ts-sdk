# TextqlRpcPublicConnectorListQueryTemplatesRequest

## Example Usage

```typescript
import { TextqlRpcPublicConnectorListQueryTemplatesRequest } from "@textql/sdk/models";

let value: TextqlRpcPublicConnectorListQueryTemplatesRequest = {};
```

## Fields

| Field                                          | Type                                           | Required                                       | Description                                    |
| ---------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- | ---------------------------------------------- |
| `connectorId`                                  | *number*                                       | :heavy_minus_sign:                             | N/A                                            |
| `limit`                                        | *number*                                       | :heavy_minus_sign:                             | Display name (e.g., "Explore Data")            |
| `offset`                                       | *number*                                       | :heavy_minus_sign:                             | Query text to send (plain text, no formatting) |
| `days`                                         | *number*                                       | :heavy_minus_sign:                             | True if requires multiple connectors           |