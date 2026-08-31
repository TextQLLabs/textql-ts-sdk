# TextqlRpcPublicCellsQuestionOption

EmailCell is the agent's "send an email" output. It is an executable cell:
 the LLM emits the input (to/subject/body) and the framework executes the
 send, mutating the result fields. The cell renders as a transcript ("Email
 sent to maya@acme.com at 2:14pm") with the body visible after the fact.

## Example Usage

```typescript
import { TextqlRpcPublicCellsQuestionOption } from "@textql/sdk/models";

let value: TextqlRpcPublicCellsQuestionOption = {};
```

## Fields

| Field                                         | Type                                          | Required                                      | Description                                   |
| --------------------------------------------- | --------------------------------------------- | --------------------------------------------- | --------------------------------------------- |
| `name`                                        | *string*                                      | :heavy_minus_sign:                            | Inputs (set by the LLM at cell creation time) |
| `description`                                 | *string*                                      | :heavy_minus_sign:                            | N/A                                           |
| `explanation`                                 | *string*                                      | :heavy_minus_sign:                            | markdown — rendered to HTML at send time      |