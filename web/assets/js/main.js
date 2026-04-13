$(document).ready(function () {
    var $modal = $('#package-modal');
    var currentPackageData = null;
    var selectedVersion = null;

    // Disable refresh buttons while refreshing to prevent double submit crashes.
    $('.search-result__refresh-form').on('submit', function (event) {
        $('.search-result__refresh-button').prop('disabled', true);
    });

    // Open modal when clicking any version pill
    $('.js-version').on('click', function (event) {
        event.preventDefault();

        var $element = $(this),
            $parentRow = $element.closest('tr'),
            clickedVersion = $element.data('version');

        // Get package data from row data attributes
        currentPackageData = {
            name: $parentRow.data('package-name'),
            type: $parentRow.data('package-type'),
            lastCommitted: $parentRow.data('package-last-committed'),
            lastFetched: $parentRow.data('package-last-fetched'),
            isActive: $parentRow.data('package-is-active') === true || $parentRow.data('package-is-active') === 'true',
            versions: $parentRow.data('package-versions') || []
        };

        // Set selected version (use first available if "more..." was clicked)
        if (clickedVersion) {
            selectedVersion = clickedVersion;
        } else if (currentPackageData.versions.length > 0) {
            // For "more..." pill, select the latest version
            var versions = currentPackageData.versions.slice().reverse();
            selectedVersion = versions[0] !== 'dev-trunk' ? versions[0] : (versions[1] || versions[0]);
        }

        openModal();
    });

    function openModal() {
        if (!currentPackageData) return;

        // Populate modal header
        $('#modal-package-name').text(currentPackageData.name);

        // Populate info grid
        $('#modal-package-type').text(capitalizeFirst(currentPackageData.type));
        $('#modal-package-committed').text(currentPackageData.lastCommitted);
        $('#modal-package-fetched').text(currentPackageData.lastFetched);

        // Active status
        if (currentPackageData.isActive) {
            $('#modal-package-active').html('<span class="status-icon status-icon--active"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg></span>');
        } else {
            $('#modal-package-active').html('<span class="status-icon status-icon--inactive"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg></span>');
        }

        // Set links
        $('#modal-wp-link').attr('href', 'https://wordpress.org/' + currentPackageData.type + 's/' + currentPackageData.name + '/');

        // Build versions pills
        var $versionsContainer = $('#modal-versions');
        $versionsContainer.empty();

        var versions = currentPackageData.versions.slice().reverse();

        // Show dev-trunk first if available
        var devTrunkIndex = versions.indexOf('dev-trunk');
        if (devTrunkIndex > -1) {
            versions.splice(devTrunkIndex, 1);
            versions.unshift('dev-trunk');
        }

        versions.forEach(function(version) {
            var isDevTrunk = version === 'dev-trunk';
            var isSelected = version === selectedVersion;
            var classes = 'version-pill';
            if (isDevTrunk) classes += ' version-pill--dev';
            if (isSelected) classes += ' version-pill--selected';

            var $pill = $('<a href="#" data-version="' + version + '" class="' + classes + '">' + version + '</a>');
            $versionsContainer.append($pill);
        });

        // Update copy field
        updateCopyField();

        // Show modal
        $modal.addClass('modal--open');
        $('body').css('overflow', 'hidden');
    }

    function updateCopyField() {
        if (!currentPackageData || !selectedVersion) return;

        var copyString = '"wpackagist-' + currentPackageData.type + '/' + currentPackageData.name + '":"' + selectedVersion + '"';
        $('#modal-copy-field').val(copyString);
    }

    function capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function closeModal() {
        $modal.removeClass('modal--open');
        $('body').css('overflow', '');
        currentPackageData = null;
        selectedVersion = null;
    }

    // Close modal on backdrop click
    $modal.on('click', '.modal__backdrop', function () {
        closeModal();
    });

    // Close modal on close button click
    $modal.on('click', '.modal__close', function () {
        closeModal();
    });

    // Close modal on Escape key
    $(document).on('keydown', function (e) {
        if (e.key === 'Escape' && $modal.hasClass('modal--open')) {
            closeModal();
        }
    });

    // Select version in modal
    $modal.on('click', '.version-pill', function (event) {
        event.preventDefault();

        var $pill = $(this);
        selectedVersion = $pill.data('version');

        // Update selected state
        $modal.find('.version-pill').removeClass('version-pill--selected');
        $pill.addClass('version-pill--selected');

        // Update copy field
        updateCopyField();
    });

    // Copy button functionality
    $modal.on('click', '#modal-copy-btn', function () {
        var $input = $('#modal-copy-field');
        var $button = $(this);

        $input.select();

        if (navigator.clipboard) {
            navigator.clipboard.writeText($input.val()).then(function () {
                $button.addClass('modal__copy-suffix--copied').html('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>');

                setTimeout(function () {
                    $button.removeClass('modal__copy-suffix--copied').html('<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>');
                }, 2000);
            });
        } else {
            // Fallback for older browsers
            document.execCommand('copy');
        }
    });

    // Handle refresh link in modal
    $modal.on('click', '#modal-refresh-link', function (event) {
        event.preventDefault();

        if (!currentPackageData) return;

        var $link = $(this);

        // Show loading state
        $link.addClass('modal__action-link--loading');
        $link.html('<svg class="modal__spinner" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>Checking for updates...');

        // Create and submit a form to refresh the package
        var $form = $('<form action="/update" method="post">' +
            '<input type="hidden" name="name" value="' + currentPackageData.name + '">' +
            '</form>');

        $('body').append($form);
        $form.submit();
    });
});
