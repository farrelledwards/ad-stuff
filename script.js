(function() {
    'use strict';

    // ========== CSV PARSING ==========

    /**
     * Parse CSV text into array of objects (RFC 4180 compliant)
     * Handles quoted fields with commas, newlines, and escaped quotes
     */
    function parseCSV(csvText) {
        const lines = [];
        let currentLine = [];
        let currentField = '';
        let insideQuotes = false;

        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            const nextChar = csvText[i + 1];

            if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                    currentField += '"';
                    i++; // Skip next quote
                } else {
                    insideQuotes = !insideQuotes;
                }
            } else if (char === ',' && !insideQuotes) {
                currentLine.push(currentField);
                currentField = '';
            } else if ((char === '\n' || char === '\r') && !insideQuotes) {
                if (char === '\r' && nextChar === '\n') i++; // Skip \n in \r\n
                currentLine.push(currentField);
                if (currentLine.some(field => field.trim())) {
                    lines.push(currentLine);
                }
                currentLine = [];
                currentField = '';
            } else {
                currentField += char;
            }
        }

        // Handle last line
        if (currentField || currentLine.length > 0) {
            currentLine.push(currentField);
            lines.push(currentLine);
        }

        // Convert to objects using first row as headers
        const headers = lines[0].map(h => h.trim());
        return lines.slice(1).map(line => {
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = line[index] || '';
            });
            return obj;
        });
    }

    /**
     * Clean price value - handle empty, "???" or valid prices
     */
    function cleanPrice(price) {
        const cleaned = (price || '').trim();
        if (cleaned === '' || cleaned === '???') return null;
        return cleaned;
    }

    /**
     * Parse comma-separated image filenames into array of paths
     */
    function parseImages(imagesStr) {
        if (!imagesStr || imagesStr.trim() === '') return [];
        return imagesStr
            .split(',')
            .map(img => img.trim())
            .filter(img => img.length > 0)
            .map(img => `images/${img}`);
    }

    /**
     * Normalize raw CSV row into structured item object
     */
    function normalizeItem(rawItem) {
        return {
            name: rawItem.Item || 'Unnamed Item',
            newPrice: cleanPrice(rawItem['New price']),
            askingPrice: cleanPrice(rawItem['Asking price']),
            available: rawItem.Available || '',
            images: parseImages(rawItem.Images),
            notes: rawItem.Notes || '',
            sold: (rawItem.Status || '').toLowerCase().trim() === 'sold'
        };
    }

    // ========== HTML GENERATION ==========

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format availability text
     */
    function formatAvailability(available) {
        if (!available || available === '???' || available.trim() === '') {
            return null;
        }
        if (available.toLowerCase() === 'now') {
            return 'Available now';
        }
        return `Available ${available}`;
    }

    /**
     * Render image container with thumbnails for an item
     */
    function renderImageContainer(item) {
        if (item.images.length === 0) {
            return ''; // No images (shouldn't happen per user confirmation)
        }

        const mainImage = item.images[0];
        const thumbnails = item.images.length > 1
            ? `<div class="item-thumbnails">
                ${item.images.map((img, index) => `
                    <img src="${img}"
                         class="thumbnail${index === 0 ? ' active' : ''}"
                         data-full-image="${img}"
                         alt="View ${index + 1}">
                `).join('')}
               </div>`
            : '';

        return `
            <div class="item-image-container">
                <img src="${mainImage}"
                     alt="${escapeHtml(item.name)}"
                     class="item-image item-main-image"
                     data-full-image="${mainImage}">
                ${thumbnails}
            </div>
        `;
    }

    /**
     * Render item details (name, prices, description, availability)
     */
    function renderItemDetails(item) {
        const priceHTML = item.askingPrice
            ? `<div class="item-price">${item.askingPrice} AED</div>`
            : '<div class="item-price unavailable">Contact for price</div>';

        const originalPriceHTML = item.newPrice
            ? `<div class="item-original-price">New: ${item.newPrice} AED</div>`
            : '';

        const descriptionHTML = item.notes
            ? `<p class="item-description">${escapeHtml(item.notes)}</p>`
            : '';

        const availabilityText = formatAvailability(item.available);
        const availabilityHTML = availabilityText
            ? `<span class="item-availability">${availabilityText}</span>`
            : '';

        return `
            <div class="item-details">
                <h2 class="item-name">${escapeHtml(item.name)}</h2>
                ${priceHTML}
                ${originalPriceHTML}
                ${descriptionHTML}
                ${availabilityHTML}
            </div>
        `;
    }

    /**
     * Render complete item card
     */
    function renderItemCard(item) {
        const soldClass = item.sold ? ' sold' : '';
        const singleImageClass = item.images.length <= 1 ? ' single-image' : '';

        return `
            <div class="item-card${soldClass}${singleImageClass}">
                ${renderImageContainer(item)}
                ${renderItemDetails(item)}
            </div>
        `;
    }

    // ========== DATA LOADING ==========

    /**
     * Load products from CSV and render to page
     */
    async function loadProducts() {
        try {
            const response = await fetch('data/data.csv');
            if (!response.ok) {
                throw new Error(`Failed to load CSV: ${response.status}`);
            }

            const csvText = await response.text();
            const items = parseCSV(csvText).map(normalizeItem);

            const grid = document.querySelector('.items-grid');
            grid.innerHTML = items.map(renderItemCard).join('');

        } catch (error) {
            console.error('Error loading products:', error);
            const grid = document.querySelector('.items-grid');
            grid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; color: white; padding: 40px;">
                    <p style="font-size: 1.2em; margin-bottom: 10px;">Unable to load products.</p>
                    <p>Please refresh the page or contact us via WhatsApp.</p>
                </div>
            `;
        }
    }

    // ========== MODAL & THUMBNAIL CODE ==========

    // Create modal HTML
    function createModal() {
        const modalHTML = `
            <div class="modal-overlay" id="imageModal">
                <div class="modal-content">
                    <button class="modal-close" aria-label="Close modal">&times;</button>
                    <img src="" alt="Full size image" class="modal-image" id="modalImage">
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    function init() {
        // Load products from CSV
        loadProducts();

        // Setup modal
        createModal();

        const modal = document.getElementById('imageModal');
        const modalImage = document.getElementById('modalImage');
        const closeBtn = modal.querySelector('.modal-close');

        // Click main image to open modal
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('item-main-image')) {
                const fullImageSrc = e.target.getAttribute('data-full-image');
                openModal(fullImageSrc);
            }
        });

        // Click thumbnail to switch main image
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('thumbnail')) {
                switchMainImage(e.target);
            }
        });

        // Close modal on button click
        closeBtn.addEventListener('click', closeModal);

        // Close modal on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        // Close modal on ESC key
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeModal();
            }
        });

        function openModal(imageSrc) {
            modalImage.src = imageSrc;
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }

        function switchMainImage(thumbnail) {
            const card = thumbnail.closest('.item-card');
            const mainImage = card.querySelector('.item-main-image');
            const fullImageSrc = thumbnail.getAttribute('data-full-image');

            // Update main image
            mainImage.src = fullImageSrc;
            mainImage.setAttribute('data-full-image', fullImageSrc);

            // Update active thumbnail
            card.querySelectorAll('.thumbnail').forEach(thumb => {
                thumb.classList.remove('active');
            });
            thumbnail.classList.add('active');
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
