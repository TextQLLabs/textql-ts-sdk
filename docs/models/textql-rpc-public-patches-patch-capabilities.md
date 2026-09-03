# TextqlRpcPublicPatchesPatchCapabilities

PatchCapabilities describes which patch actions the calling member is
 permitted to perform. This is a read-only mirror of the authority checks in
 ApprovePatch and DenyPatch; computing it has no side effects and emits no
 audit log.

## Example Usage

```typescript
import { TextqlRpcPublicPatchesPatchCapabilities } from "@textql/sdk/models";

let value: TextqlRpcPublicPatchesPatchCapabilities = {};
```

## Fields

| Field              | Type               | Required           | Description        |
| ------------------ | ------------------ | ------------------ | ------------------ |
| `canApprove`       | *boolean*          | :heavy_minus_sign: | N/A                |
| `canDeny`          | *boolean*          | :heavy_minus_sign: | N/A                |
| `canRestore`       | *boolean*          | :heavy_minus_sign: | N/A                |
| `callerApproved`   | *boolean*          | :heavy_minus_sign: | N/A                |