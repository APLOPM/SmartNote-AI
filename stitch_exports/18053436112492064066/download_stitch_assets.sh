#!/usr/bin/env bash
set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")" && pwd)"
CSV_FILE="${1:-$BASE_DIR/screen_assets.csv}"
OUT_DIR="${2:-$BASE_DIR/downloaded}"

mkdir -p "$OUT_DIR/images" "$OUT_DIR/code"

if [[ ! -f "$CSV_FILE" ]]; then
  echo "CSV file not found: $CSV_FILE" >&2
  exit 1
fi

# CSV header: screen_name,screen_id,image_url,code_url
{
  IFS= read -r _header
  while IFS=, read -r screen_name screen_id image_url code_url; do
    safe_name="$(echo "$screen_name" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-')"

    if [[ -n "${image_url}" ]]; then
      image_out="$OUT_DIR/images/${safe_name}-${screen_id}.png"
      echo "Downloading image: $screen_name"
      curl -fL "$image_url" -o "$image_out"
    else
      echo "Skipping image for $screen_name ($screen_id): missing image_url"
    fi

    if [[ -n "${code_url}" ]]; then
      code_out="$OUT_DIR/code/${safe_name}-${screen_id}.zip"
      echo "Downloading code: $screen_name"
      curl -fL "$code_url" -o "$code_out"
    else
      echo "Skipping code for $screen_name ($screen_id): missing code_url"
    fi
  done
} < "$CSV_FILE"

echo "Done. Files saved under: $OUT_DIR"
