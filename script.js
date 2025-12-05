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
     * Render image container with arrow navigation for an item
     */
    function renderImageContainer(item) {
        if (item.images.length === 0) {
            return ''; // No images (shouldn't happen per user confirmation)
        }

        const mainImage = item.images[0];
        const hasMultipleImages = item.images.length > 1;

        // Navigation UI for multiple images
        const navigationHTML = hasMultipleImages
            ? `<button class="image-nav-prev" aria-label="Previous image">‹</button>
               <button class="image-nav-next" aria-label="Next image">›</button>
               <div class="image-counter">1 / ${item.images.length}</div>`
            : '';

        return `
            <div class="item-image-container" data-images='${JSON.stringify(item.images)}'>
                <img src="${mainImage}"
                     alt="${escapeHtml(item.name)}"
                     class="item-image item-main-image"
                     data-full-image="${mainImage}"
                     data-current-index="0">
                ${navigationHTML}
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

    // ========== IMAGE NAVIGATION ==========

    /**
     * Navigate through images in a card
     * @param {HTMLElement} container - The item-image-container element
     * @param {number} direction - Direction to navigate (-1 for prev, 1 for next)
     */
    function navigateImage(container, direction) {
        const mainImage = container.querySelector('.item-main-image');
        const counter = container.querySelector('.image-counter');

        // Get image array from data attribute
        const images = JSON.parse(container.getAttribute('data-images'));

        // Get current index
        let currentIndex = parseInt(mainImage.getAttribute('data-current-index') || 0);

        // Calculate new index (with wrapping)
        currentIndex = (currentIndex + direction + images.length) % images.length;

        // Update image
        mainImage.src = images[currentIndex];
        mainImage.setAttribute('data-full-image', images[currentIndex]);
        mainImage.setAttribute('data-current-index', currentIndex);

        // Update counter
        if (counter) {
            counter.textContent = `${currentIndex + 1} / ${images.length}`;
        }

        return currentIndex;
    }

    // Touch swipe variables for card navigation
    let touchStartX = 0;
    let touchEndX = 0;

    /**
     * Handle swipe gesture on card images
     * @param {HTMLElement} container - The item-image-container element
     */
    function handleSwipe(container) {
        const swipeThreshold = 50; // Minimum distance for swipe
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swiped left - next image
                navigateImage(container, 1);
            } else {
                // Swiped right - previous image
                navigateImage(container, -1);
            }
        }
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
                    <button class="modal-nav-prev" aria-label="Previous image">‹</button>
                    <button class="modal-nav-next" aria-label="Next image">›</button>
                    <img src="" alt="Full size image" class="modal-image" id="modalImage">
                    <div class="modal-counter"></div>
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
        const modalNavPrev = modal.querySelector('.modal-nav-prev');
        const modalNavNext = modal.querySelector('.modal-nav-next');
        const modalCounter = modal.querySelector('.modal-counter');

        let currentModalCard = null; // Track which card opened the modal

        // ===== CARD NAVIGATION =====

        // Click arrow buttons on cards
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('image-nav-prev')) {
                e.stopPropagation(); // Prevent modal from opening
                const container = e.target.closest('.item-image-container');
                navigateImage(container, -1);
            } else if (e.target.classList.contains('image-nav-next')) {
                e.stopPropagation();
                const container = e.target.closest('.item-image-container');
                navigateImage(container, 1);
            }
        });

        // Touch swipe on cards
        document.addEventListener('touchstart', function(e) {
            const container = e.target.closest('.item-image-container');
            if (container && !modal.classList.contains('active')) {
                touchStartX = e.changedTouches[0].screenX;
            }
        });

        document.addEventListener('touchend', function(e) {
            const container = e.target.closest('.item-image-container');
            if (container && !modal.classList.contains('active')) {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe(container);
            }
        });

        // ===== MODAL NAVIGATION =====

        // Click main image to open modal
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('item-main-image')) {
                const card = e.target.closest('.item-card');
                const fullImageSrc = e.target.getAttribute('data-full-image');
                openModal(fullImageSrc, card);
            }
        });

        function openModal(imageSrc, card) {
            currentModalCard = card;
            const container = card.querySelector('.item-image-container');
            const images = JSON.parse(container.getAttribute('data-images'));
            const currentIndex = parseInt(container.querySelector('.item-main-image').getAttribute('data-current-index') || 0);

            modalImage.src = imageSrc;
            modalImage.setAttribute('data-images', JSON.stringify(images));
            modalImage.setAttribute('data-current-index', currentIndex);

            // Update modal counter
            updateModalCounter(currentIndex, images.length);

            // Show/hide navigation for single vs multiple images
            const hasMultiple = images.length > 1;
            modalNavPrev.style.display = hasMultiple ? 'flex' : 'none';
            modalNavNext.style.display = hasMultiple ? 'flex' : 'none';
            modalCounter.style.display = hasMultiple ? 'block' : 'none';

            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function navigateModalImage(direction) {
            const images = JSON.parse(modalImage.getAttribute('data-images'));
            let currentIndex = parseInt(modalImage.getAttribute('data-current-index') || 0);

            currentIndex = (currentIndex + direction + images.length) % images.length;

            modalImage.src = images[currentIndex];
            modalImage.setAttribute('data-current-index', currentIndex);

            updateModalCounter(currentIndex, images.length);

            // Sync with card image
            if (currentModalCard) {
                const cardContainer = currentModalCard.querySelector('.item-image-container');
                const cardImage = cardContainer.querySelector('.item-main-image');
                cardImage.src = images[currentIndex];
                cardImage.setAttribute('data-current-index', currentIndex);
                cardImage.setAttribute('data-full-image', images[currentIndex]);

                const cardCounter = cardContainer.querySelector('.image-counter');
                if (cardCounter) {
                    cardCounter.textContent = `${currentIndex + 1} / ${images.length}`;
                }
            }
        }

        function updateModalCounter(index, total) {
            if (modalCounter && total > 1) {
                modalCounter.textContent = `${index + 1} / ${total}`;
            }
        }

        // Modal arrow buttons
        modalNavPrev.addEventListener('click', function(e) {
            e.stopPropagation();
            navigateModalImage(-1);
        });

        modalNavNext.addEventListener('click', function(e) {
            e.stopPropagation();
            navigateModalImage(1);
        });

        // Close modal on button click
        closeBtn.addEventListener('click', closeModal);

        // Close modal on overlay click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });

        function closeModal() {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            currentModalCard = null;
        }

        // ===== KEYBOARD NAVIGATION =====

        document.addEventListener('keydown', function(e) {
            if (modal.classList.contains('active')) {
                if (e.key === 'Escape') {
                    closeModal();
                } else if (e.key === 'ArrowLeft') {
                    navigateModalImage(-1);
                } else if (e.key === 'ArrowRight') {
                    navigateModalImage(1);
                }
            }
        });

        // ===== MODAL SWIPE SUPPORT =====

        let modalTouchStartX = 0;
        let modalTouchEndX = 0;

        modal.addEventListener('touchstart', function(e) {
            if (e.target === modalImage) {
                modalTouchStartX = e.changedTouches[0].screenX;
            }
        });

        modal.addEventListener('touchend', function(e) {
            if (e.target === modalImage) {
                modalTouchEndX = e.changedTouches[0].screenX;
                const diff = modalTouchStartX - modalTouchEndX;
                const swipeThreshold = 50;

                if (Math.abs(diff) > swipeThreshold) {
                    if (diff > 0) {
                        navigateModalImage(1);
                    } else {
                        navigateModalImage(-1);
                    }
                }
            }
        });
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
