#!/bin/bash

# Bulk JPEG compression script
# Usage: ./compress-images.sh /path/to/folder

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

echo "Processing images in: $FOLDER"
echo ""

# Count files
JPEG_COUNT=$(find "$FOLDER" -maxdepth 1 \( -iname "*.jpg" -o -iname "*.jpeg" \) | wc -l)
PNG_COUNT=$(find "$FOLDER" -maxdepth 1 -iname "*.png" | wc -l)
echo "Found $JPEG_COUNT JPEG files and $PNG_COUNT PNG files"
echo ""

# Process JPEG files
PROCESSED=0
echo "=== Processing JPEGs ==="
for file in "$FOLDER"/*.{jpg,jpeg} 2>/dev/null; do
    # Skip if no files match
    [ -e "$file" ] || continue
    
    filename=$(basename "$file")
    
    # Get original size
    ORIG_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    ORIG_MB=$(echo "scale=2; $ORIG_SIZE/1024/1024" | bc)
    
    # Compress JPEG
    mogrify -quality 75 -strip "$file"
    
    # Get new size
    NEW_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    NEW_MB=$(echo "scale=2; $NEW_SIZE/1024/1024" | bc)
    REDUCTION=$(echo "scale=1; ($ORIG_SIZE-$NEW_SIZE)*100/$ORIG_SIZE" | bc)
    
    echo "✓ $filename: ${ORIG_MB}MB → ${NEW_MB}MB (${REDUCTION}% reduction)"
    
    PROCESSED=$((PROCESSED + 1))
done

# Process PNG files (convert to JPEG for better compression)
echo ""
echo "=== Processing PNGs (converting to JPEG) ==="
for file in "$FOLDER"/*.{png,PNG} 2>/dev/null; do
    # Skip if no files match
    [ -e "$file" ] || continue
    
    filename=$(basename "$file")
    basename_no_ext="${filename%.*}"
    
    # Get original size
    ORIG_SIZE=$(stat -f%z "$file" 2>/dev/null || stat -c%s "$file" 2>/dev/null)
    ORIG_MB=$(echo "scale=2; $ORIG_SIZE/1024/1024" | bc)
    
    # Convert PNG to JPEG with compression
    convert "$file" -quality 75 -strip "${FOLDER}/${basename_no_ext}.jpg"
    
    # Remove original PNG
    rm "$file"
    
    # Get new size
    NEW_FILE="${FOLDER}/${basename_no_ext}.jpg"
    NEW_SIZE=$(stat -f%z "$NEW_FILE" 2>/dev/null || stat -c%s "$NEW_FILE" 2>/dev/null)
    NEW_MB=$(echo "scale=2; $NEW_SIZE/1024/1024" | bc)
    REDUCTION=$(echo "scale=1; ($ORIG_SIZE-$NEW_SIZE)*100/$ORIG_SIZE" | bc)
    
    echo "✓ $filename → ${basename_no_ext}.jpg: ${ORIG_MB}MB → ${NEW_MB}MB (${REDUCTION}% reduction)"
    
    PROCESSED=$((PROCESSED + 1))
done

echo ""
echo "Complete! Processed $PROCESSED files"
