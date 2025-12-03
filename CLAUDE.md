# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Important: Working with Files

**Always read files first before making changes.** The user frequently makes edits to files outside of Claude Code, so the files on disk are the source of truth. Never assume the file structure or content - always read the current state before proposing or making changes.

## Project Overview

This is a static HTML website for a moving sale in Abu Dhabi. The project is a single-page application with no build process or dependencies - just HTML, CSS, JavaScript, and images.

## Project Structure

```
ad-stuff/
├── index.html          # Main and only HTML file with embedded CSS and JavaScript
├── images/             # Product images (various formats: .png, .jpeg, etc.)
├── .gitignore          # Git ignore file (includes .DS_Store and common exclusions)
└── README.md           # Minimal project documentation
```

## Architecture

- **Single-file architecture**: All HTML, CSS, and JavaScript are contained in `index.html`
- **Multi-image gallery**: Items can have 2-3 images with thumbnail navigation
- **Modal/lightbox**: Click images to view full-size in an overlay modal
- **Responsive grid layout**: Uses CSS Grid for the items display, with responsive breakpoints
- **Sold state management**: Items can be marked as sold by adding the `sold` class to the item-card div
- **Vanilla JavaScript**: No external libraries, uses event delegation for efficiency

## Development Workflow

Since this is a static HTML site with no build process:

1. **Editing**: Make changes directly to `index.html`
2. **Testing**: Open `index.html` in a browser to view changes
3. **Deployment**: The file can be served directly by any static web server

## Adding New Items

### Multi-image item (2-3 images):
```html
<div class="item-card">
    <div class="item-image-container">
        <img src="images/item.jpg" alt="Item name" class="item-image item-main-image" data-full-image="images/item.jpg">
        <div class="item-thumbnails">
            <img src="images/item.jpg" class="thumbnail active" data-full-image="images/item.jpg" alt="View 1">
            <img src="images/item-2.jpg" class="thumbnail" data-full-image="images/item-2.jpg" alt="View 2">
            <img src="images/item-3.jpg" class="thumbnail" data-full-image="images/item-3.jpg" alt="View 3">
        </div>
    </div>
    <div class="item-details">
        <h2 class="item-name">Item Name</h2>
        <div class="item-price">XXX AED</div>
        <p class="item-description">Description text</p>
        <span class="item-condition">Condition</span>
    </div>
</div>
```

### Single-image item:
```html
<div class="item-card single-image">
    <div class="item-image-container">
        <img src="images/item.jpg" alt="Item name" class="item-image item-main-image" data-full-image="images/item.jpg">
    </div>
    <div class="item-details">
        <h2 class="item-name">Item Name</h2>
        <div class="item-price">XXX AED</div>
        <p class="item-description">Description text</p>
        <span class="item-condition">Condition</span>
    </div>
</div>
```

To mark an item as sold, add the `sold` class: `<div class="item-card sold">`

## Image Gallery Features

- **Thumbnails**: Click to switch the main image within the card
- **Modal lightbox**: Click main image to view full-size
- **Close modal**: ESC key, X button, or click outside the modal
- **Active thumbnail**: Highlighted with purple border matching site theme

## Contact Information

Contact details appear in both the header and footer sections. Always read the file to find current line numbers.
