#!/usr/bin/env bash
# Generates PNG/ICO favicon variants from logo.svg and favicon.svg
# Requires: Inkscape (preferred) or ImageMagick + librsvg (rsvg-convert)
#
# Install on macOS:
#   brew install inkscape        (preferred)
#   brew install librsvg imagemagick  (alternative)

set -e
cd "$(dirname "$0")"

echo "Generating favicon assets from logo.svg / favicon.svg..."

generate() {
  local src=$1 out=$2 size=$3
  if command -v inkscape &>/dev/null; then
    inkscape --export-type=png --export-width="$size" --export-height="$size" \
             --export-filename="$out" "$src" 2>/dev/null
  elif command -v rsvg-convert &>/dev/null; then
    rsvg-convert -w "$size" -h "$size" -o "$out" "$src"
  else
    echo "ERROR: install inkscape or librsvg (rsvg-convert) first."
    exit 1
  fi
  echo "  ✓ $out (${size}x${size})"
}

# Favicon sizes (from favicon.svg — has terra bg, cream icon)
generate favicon.svg favicon-16.png  16
generate favicon.svg favicon-32.png  32
generate favicon.svg favicon-48.png  48
generate favicon.svg favicon-144.png 144
generate favicon.svg apple-touch-icon.png 180

# Full logo sizes (transparent background, terra color)
generate logo.svg logo-64.png   64
generate logo.svg logo-128.png 128
generate logo.svg logo-256.png 256
generate logo.svg logo-512.png 512

# Build favicon.ico (multi-resolution: 16+32+48) using ImageMagick
if command -v convert &>/dev/null; then
  convert favicon-16.png favicon-32.png favicon-48.png favicon.ico
  echo "  ✓ favicon.ico (16/32/48px)"
else
  echo "  ⚠ Skipped favicon.ico — install imagemagick: brew install imagemagick"
fi

echo "Done. All assets generated in project root."
