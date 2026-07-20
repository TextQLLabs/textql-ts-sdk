# TextqlRpcPublicCellsPlaybookReportStyleLight

Playbook report output style - matches parseReportStyle in playbook_helpers.go
 REPORT_STYLE_EXECUTIVE = "Executive_Report" or "Executive"
 REPORT_STYLE_VERBOSE = "Verbose" or "Thorough"
 REPORT_STYLE_CONCISE = "Concise" or "Brief"

## Example Usage

```typescript
import { TextqlRpcPublicCellsPlaybookReportStyleLight } from "textql-sdk/models";

let value: TextqlRpcPublicCellsPlaybookReportStyleLight =
  "REPORT_STYLE_LIGHT_CONCISE";

// Open enum: unrecognized values are captured as Unrecognized<string>
```

## Values

```typescript
"REPORT_STYLE_LIGHT_UNKNOWN" | "REPORT_STYLE_LIGHT_EXECUTIVE" | "REPORT_STYLE_LIGHT_VERBOSE" | "REPORT_STYLE_LIGHT_CONCISE" | Unrecognized<string>
```