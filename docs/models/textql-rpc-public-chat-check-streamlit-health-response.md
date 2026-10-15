# TextqlRpcPublicChatCheckStreamlitHealthResponse

## Example Usage

```typescript
import { TextqlRpcPublicChatCheckStreamlitHealthResponse } from "@textql/sdk/models";

let value: TextqlRpcPublicChatCheckStreamlitHealthResponse = {
  cell: {
    ontologyEditorCell: {
      listObjects: [
        {
          backingQuery: "<value>",
          accessTime: new Date("2023-01-15T01:30:15.01Z"),
        },
      ],
      listAttributes: [
        {
          accessTime: new Date("2023-01-15T01:30:15.01Z"),
        },
      ],
      listMetrics: [
        {
          accessTime: new Date("2023-01-15T01:30:15.01Z"),
        },
      ],
      createdObject: {
        backingQuery: "<value>",
        accessTime: new Date("2023-01-15T01:30:15.01Z"),
      },
      createdAttributes: [
        {
          accessTime: new Date("2023-01-15T01:30:15.01Z"),
        },
      ],
      updatedObject: {
        backingTable: {},
        accessTime: new Date("2023-01-15T01:30:15.01Z"),
      },
      deletedObject: {
        backingQuery: "<value>",
        accessTime: new Date("2023-01-15T01:30:15.01Z"),
      },
      createdAttribute: {
        accessTime: new Date("2023-01-15T01:30:15.01Z"),
      },
      updatedAttribute: {
        accessTime: new Date("2023-01-15T01:30:15.01Z"),
      },
      deletedAttribute: {
        accessTime: new Date("2023-01-15T01:30:15.01Z"),
      },
      createdMetric: {
        accessTime: new Date("2023-01-15T01:30:15.01Z"),
      },
      updatedMetric: {
        accessTime: new Date("2023-01-15T01:30:15.01Z"),
      },
      deletedMetric: {
        accessTime: new Date("2023-01-15T01:30:15.01Z"),
      },
    },
    timestamp: new Date("2023-01-15T01:30:15.01Z"),
  },
};
```

## Fields

| Field                                                                                                          | Type                                                                                                           | Required                                                                                                       | Description                                                                                                    |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `status`                                                                                                       | [models.TextqlRpcPublicChatStreamlitHealthStatus](../models/textql-rpc-public-chat-streamlit-health-status.md) | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `cell`                                                                                                         | *models.TextqlRpcPublicChatCell*                                                                               | :heavy_minus_sign:                                                                                             | N/A                                                                                                            |
| `embedUrl`                                                                                                     | *string*                                                                                                       | :heavy_minus_sign:                                                                                             | Dynamic URL from state manager                                                                                 |
| `streamlitUrl`                                                                                                 | *string*                                                                                                       | :heavy_minus_sign:                                                                                             | Raw workerId:port format                                                                                       |