# TextqlRpcPublicCellsChartReference

ChartReference points to an interactive HTML chart produced by sandbox
 code via the python cell's chart library (currently pyecharts). The chart
 is a self-contained HTML page (`html_url`) that loads its JS chart library
 from a same-origin self-hosted asset; the FE iframes this URL. A PNG
 rasterisation (`png_url`) is produced by the existing HTML→PNG screenshot
 service for the LLM's vision review, the in-chat PreviewCell thumbnail,
 downloads, and any non-JS surface.

## Example Usage

```typescript
import { TextqlRpcPublicCellsChartReference } from "textql-sdk/models";

let value: TextqlRpcPublicCellsChartReference = {};
```

## Fields

| Field                                                                                                    | Type                                                                                                     | Required                                                                                                 | Description                                                                                              |
| -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `name`                                                                                                   | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | Internal filename (e.g. echarts_chart_<slug>.html)                                                       |
| `url`                                                                                                    | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | Backwards-compat alias for html_url                                                                      |
| `htmlUrl`                                                                                                | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | s3 URL of the interactive HTML page                                                                      |
| `pngUrl`                                                                                                 | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | s3 URL of the rasterised PNG screenshot                                                                  |
| `title`                                                                                                  | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | Human-readable title from the chart's option spec                                                        |
| `specUrl`                                                                                                | *string*                                                                                                 | :heavy_minus_sign:                                                                                       | s3 URL of the declarative ECharts option JSON sidecar; empty when the chart uses JsCode and is HTML-only |