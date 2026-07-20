# PowerBIServiceGetSyncedPowerBIItemsResponse


## Supported Types

### `models.TextqlRpcPublicPowerbiGetSyncedPowerBIItemsResponse`

```typescript
const value: models.TextqlRpcPublicPowerbiGetSyncedPowerBIItemsResponse = {
  reports: [
    {
      report: {
        createdDate: new Date("2023-01-15T01:30:15.01Z"),
      },
      syncedAt: new Date("2023-01-15T01:30:15.01Z"),
    },
  ],
  datasets: [
    {
      dataset: {
        createdDate: new Date("2023-01-15T01:30:15.01Z"),
      },
      syncedAt: new Date("2023-01-15T01:30:15.01Z"),
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

