# ObservabilityServiceGetThreadWarningsResponse


## Supported Types

### `models.TextqlRpcPublicObserveGetThreadWarningsResponse`

```typescript
const value: models.TextqlRpcPublicObserveGetThreadWarningsResponse = {
  warningsByChat: {
    "key": {
      warnings: [
        {
          fixPatchCell: {
            microsoft365CalendarCell: {},
            timestamp: new Date("2023-01-15T01:30:15.01Z"),
          },
        },
      ],
    },
  },
};
```

### `models.ConnectError`

```typescript
const value: models.ConnectError = {
  code: "not_found",
};
```

