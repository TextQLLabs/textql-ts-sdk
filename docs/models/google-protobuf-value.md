# GoogleProtobufValue

`Value` represents a dynamically typed value which can be either
 null, a number, a string, a boolean, a recursive struct value, or a
 list of values. A producer of value is expected to set one of these
 variants. Absence of any variant indicates an error.

 The JSON representation for `Value` is JSON value.


## Supported Types

### `number`

```typescript
const value: number = 1284.03;
```

### `string`

```typescript
const value: string = "<value>";
```

### `boolean`

```typescript
const value: boolean = true;
```

### `any[]`

```typescript
const value: any[] = [
  "<value 1>",
  "<value 2>",
  "<value 3>",
];
```

### `{ [k: string]: any }`

```typescript
const value: { [k: string]: any } = {
  "key": "<value>",
  "key1": "<value>",
  "key2": "<value>",
};
```

