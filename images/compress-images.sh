#!/bin/bash

# Bulk image compression script - optimized for web
# Usage: ./compress-images.sh /path/to/folder
#
# This script:
# - Resizes images to max 1200px (perfect for web display)
# - Compresses JPEGs to quality 82 (good balance)
# - Converts PNGs to JPEG for better compression
# - Strips metadata to save space

if [ -z "$1" ]; then
    echo "Usage: $0 /path/to/image/folder"
    echo "Example: $0 ~/Pictures/moving-sale"
    exit 1
fi

FOLDER="$1"

if [ ! -d "$FOLDER" ]; then
    echo "Error: Directory '$FOLDER' not found"
    exit 1
fi

# Configuration
MAX_SIZE=1200          # Max width/height in pixels
JPEG_QUALITY=82        # JPEG quality (70-90 recommended, 82 is good balance)

# Create backup folder
BACKUP="${FOLDER}/originals"
mkdir -p "$BACKUP"

echo "========================================="
echo "  Image Compression for Web"
echo "========================================="
echo "Processing images in: $FOLDER"
echo "Backups will be saved to: $BACKUP"
echo ""
echo "Settings:"
echo "  Max dimension: ${MAX_SIZE}px"
echo "  JPEG quality: ${JPEG_QUALITY}"
echo ""

# Count files
JPEG_COUNT=$(find "$FOLDER" -maxdepth 1 \( -iname "*.jpg" -o -iname "*.jpeg" \) | wc -l)
PNG_COUNT=$(find "$FOLDER" -maxdepth 1 -iname "*.png" | wc -l)
echo "Found $JPEG_COUNT JPEG files and $PNG_COUNT PNG files"
echo ""

# Process JPEG files
PROCESSED=0
TOTAL_SAVED=0
echo "=== Processing JPEGs ==="
find "$FOLDER" -maxdepth 1 \( -iname "*.jpg" -o -iname "*.jpeg" \) -type f | while read -r file; do

    filename=$(basename "$file")

    # Get original size
    ORIG_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    ORIG_MB=$(echo "scale=2; $ORIG_SIZE/1024/1024" | bc)

    # Backup original
    cp "$file" "$BACKUP/"

    # Resize and compress JPEG
    # -resize: shrink to max dimension while maintaining aspect ratio
    # -quality: JPEG compression quality
    # -strip: remove all metadata (EXIF, etc.)
    # -sampling-factor 4:2:0: better compression for photos
    # -interlace Plane: progressive JPEG for better web loading
    mogrify -resize "${MAX_SIZE}x${MAX_SIZE}>" \
            -quality ${JPEG_QUALITY} \
            -strip \
            -sampling-factor 4:2:0 \
            -interlace Plane \
            "$file"

    # Get new size
    NEW_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    NEW_MB=$(echo "scale=2; $NEW_SIZE/1024/1024" | bc)
    SAVED=$(echo "scale=2; $ORIG_SIZE-$NEW_SIZE" | bc)
    REDUCTION=$(echo "scale=1; ($ORIG_SIZE-$NEW_SIZE)*100/$ORIG_SIZE" | bc)

    echo "✓ $filename: ${ORIG_MB}MB → ${NEW_MB}MB (${REDUCTION}% reduction)"

    PROCESSED=$((PROCESSED + 1))
    TOTAL_SAVED=$(echo "$TOTAL_SAVED + $SAVED" | bc)
done

# Process PNG files (convert to JPEG for better compression)
echo ""
echo "=== Processing PNGs (converting to JPEG) ==="
find "$FOLDER" -maxdepth 1 -iname "*.png" -type f | while read -r file; do

    filename=$(basename "$file")
    basename_no_ext="${filename%.*}"

    # Get original size
    ORIG_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    ORIG_MB=$(echo "scale=2; $ORIG_SIZE/1024/1024" | bc)

    # Backup original
    cp "$file" "$BACKUP/"

    # Convert PNG to JPEG with compression
    # Use 'magick' instead of deprecated 'convert'
    magick "$file" \
           -resize "${MAX_SIZE}x${MAX_SIZE}>" \
           -quality ${JPEG_QUALITY} \
           -strip \
           -sampling-factor 4:2:0 \
           -interlace Plane \
           "${FOLDER}/${basename_no_ext}.jpg"

    # Remove original PNG
    rm "$file"

    # Get new size
    NEW_FILE="${FOLDER}/${basename_no_ext}.jpg"
    NEW_SIZE=$(stat -f%z "$NEW_FILE" 2>/dev/null || stat -c%s "$NEW_FILE" 2>/dev/null)
    NEW_MB=$(echo "scale=2; $NEW_SIZE/1024/1024" | bc)
    SAVED=$(echo "scale=2; $ORIG_SIZE-$NEW_SIZE" | bc)
    REDUCTION=$(echo "scale=1; ($ORIG_SIZE-$NEW_SIZE)*100/$ORIG_SIZE" | bc)

    echo "✓ $filename → ${basename_no_ext}.jpg: ${ORIG_MB}MB → ${NEW_MB}MB (${REDUCTION}% reduction)"

    PROCESSED=$((PROCESSED + 1))
    TOTAL_SAVED=$(echo "$TOTAL_SAVED + $SAVED" | bc)
done

echo ""
echo "========================================="
echo "Complete! Processed $PROCESSED files"
TOTAL_SAVED_MB=$(echo "scale=2; $TOTAL_SAVED/1024/1024" | bc)
echo "Total space saved: ${TOTAL_SAVED_MB}MB"
echo "Original files backed up to: $BACKUP"
echo "========================================="
