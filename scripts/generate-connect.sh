#!/usr/bin/env bash
set -euo pipefail

SDK_DIR="$(cd "$(dirname "$0")/.." && pwd)"
DEMO2_DIR="${DEMO2_DIR:-$SDK_DIR/../demo2}"
OUT_DIR="$SDK_DIR/src/generated/connect"

TEMPLATE_DIR="$(mktemp -d)"
TEMPLATE="$TEMPLATE_DIR/buf.gen.yaml"
trap 'rm -rf "$TEMPLATE_DIR"' EXIT
cat > "$TEMPLATE" <<EOF
version: v2
clean: true
plugins:
  - remote: buf.build/bufbuild/es
    out: $OUT_DIR
    opt:
      - target=ts
      - import_extension=js
EOF

cd "$DEMO2_DIR/proto/api"
buf generate --include-imports --template "$TEMPLATE"

rm -rf "$OUT_DIR/platform" "$OUT_DIR/demo"

echo "regenerated $OUT_DIR"
