#!/usr/bin/env bash
# Downloads the Sarabun (Thai + Latin) TTF files used by the PDF renderer.
# Sarabun is published under the SIL Open Font License v1.1 — see
# https://fonts.google.com/specimen/Sarabun for the upstream metadata.
#
# Run this ONCE after cloning the repo, then commit the resulting .ttf
# files. The repo intentionally does not bundle them via npm so the
# package install stays small.
#
# Usage:
#   bash scripts/download-fonts.sh

set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p public/fonts

REGULAR_URL="https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-Regular.ttf"
BOLD_URL="https://github.com/google/fonts/raw/main/ofl/sarabun/Sarabun-Bold.ttf"

echo "Downloading Sarabun-Regular.ttf ..."
curl -L --fail -o public/fonts/Sarabun-Regular.ttf "$REGULAR_URL"

echo "Downloading Sarabun-Bold.ttf ..."
curl -L --fail -o public/fonts/Sarabun-Bold.ttf "$BOLD_URL"

echo "Done. Don't forget to 'git add public/fonts/Sarabun-*.ttf'."
