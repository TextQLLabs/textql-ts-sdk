# Debug

Deserialized error detail payload. The 'type' field indicates the schema. This field is for easier debugging and should not be relied upon for application logic.


## Supported Types

### `{ [k: string]: any }`

```typescript
const value: { [k: string]: any } = {
  "key": "<value>",
  "key1": "<value>",
  "key2": "<value>",
};
```

