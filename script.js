(function() {
    'use strict';

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
