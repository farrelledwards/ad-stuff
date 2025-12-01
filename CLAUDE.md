# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a static HTML website for a moving sale in Abu Dhabi. The project is a single-page application with no build process or dependencies - just HTML, CSS, and images.

## Project Structure

```
ad-stuff/
├── index.html          # Main and only HTML file with embedded CSS
├── images/             # Product images (1.png through 5.png)
└── README.md           # Minimal project documentation
```

## Architecture

- **Single-file architecture**: All HTML and CSS are contained in `index.html` with inline styles
- **No JavaScript**: The page is purely static with no interactivity beyond CSS hover effects
- **Responsive grid layout**: Uses CSS Grid for the items display, with responsive breakpoints
- **Sold state management**: Items can be marked as sold by adding the `sold` class to the item-card div

## Development Workflow

Since this is a static HTML site with no build process:

1. **Editing**: Make changes directly to `index.html`
2. **Testing**: Open `index.html` in a browser to view changes
3. **Deployment**: The file can be served directly by any static web server

## Adding New Items

To add a new item for sale, copy the item-card structure:

```html
<div class="item-card">
    <img src="images/X.png" alt="Item name" class="item-image">
    <div class="item-details">
        <h2 class="item-name">Item Name</h2>
        <div class="item-price">XXX AED</div>
        <p class="item-description">Description text</p>
        <span class="item-condition">Condition</span>
    </div>
</div>
```

To mark an item as sold, add the `sold` class: `<div class="item-card sold">`

## Contact Information

Update the footer section (lines 199-202) to change contact details or location information.
