<!-- Start SDK Example Usage [usage] -->
```typescript
import { Textql } from "textql-sdk";

const textql = new Textql({
  apiKey: process.env["TEXTQL_API_KEY"] ?? "",
});

async function run() {
  const result = await textql.agents.create({
    connectProtocolVersion: 1,
    body: {},
  });

  console.log(result);
}

run();

```
<!-- End SDK Example Usage [usage] -->