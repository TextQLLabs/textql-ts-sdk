# ChatServiceRunChatResponse


## Supported Types

### `models.TextqlRpcPublicChatRunChatResponse`

```typescript
const value: models.TextqlRpcPublicChatRunChatResponse = {
  cells: [
    {
      tableauSqlCell: {
        dataframe: {
          df: {
            records: [
              {
                columns: [
                  {
                    doubles: {},
                  },
                ],
              },
            ],
          },
        },
      },
      timestamp: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
};
```

### `models.ConnectError`

```typescript
const value: models.ConnectError = {
  code: "not_found",
};
```

