# TextqlRpcPowerbiSelectionPowerBISelection

PowerBISelection captures a chosen PowerBI workspace (and optionally the
 specific reports/datasets within it) for attaching to a chat. Field shape
 mirrors textql.rpc.public.paradigm.PowerBISelection; kept in a standalone
 package so it can be shared by paradigm_params without an import cycle
 (public/paradigm.proto already imports paradigm_params.proto).

## Example Usage

```typescript
import { TextqlRpcPowerbiSelectionPowerBISelection } from "@textql/sdk/models";

let value: TextqlRpcPowerbiSelectionPowerBISelection = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `workspaceId`      | *string*           | :heavy_minus_sign: | N/A                |
| `reportIds`        | *string*[]         | :heavy_minus_sign: | N/A                |
| `datasetIds`       | *string*[]         | :heavy_minus_sign: | N/A                |
| `workspaceName`    | *string*           | :heavy_minus_sign: | N/A                |
| `connectorId`      | *number*           | :heavy_minus_sign: | N/A                |