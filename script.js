// Developer: Ajay Singh
// Version: 1st version
// Date: 2024-06-04

document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const searchInput = document.getElementById('searchInput');
    const container = document.querySelector('.container');
    let resizeHandle; // Declare resizeHandle variable
    let data = [];
    let lastClickedCell = null;
    let isResizing = false;

    fileInput.addEventListener('change', handleFile, false);
    searchInput.addEventListener('input', handleSearch, false);

    // Handle the file input
    function handleFile(e) {
        const file = e.target.files[0];
        if (!file) {
            alert("No file selected.");
            return;
        }

        const reader = new FileReader();
        const extension = file.name.split('.').pop().toLowerCase();

        // Load the file based on its extension
        reader.onload = (event) => {
            try {
                let rawData = event.target.result;
                let workbook;

                if (extension === 'xlsx' || extension === 'xls') {
                    rawData = new Uint8Array(rawData);
                    workbook = XLSX.read(rawData, { type: 'array' });
                } else if (extension === 'csv' || extension === 'txt') {
                    workbook = XLSX.read(rawData, { type: 'string' });
                } else {
                    showAlert('Unsupported file type', 'error');
                    return;
                }

                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

                console.log('Data loaded successfully:', data); // Log loaded data
                displayData(data);
                showSearchBar(); // Show search bar after file is imported
                enableResizing(); // Enable resizing after file is loaded
                container.style.width = '100%'; // Adjust width when file is loaded
            } catch (error) {
                showAlert('Error reading file: ' + error.message, 'error');
                console.error('Error reading file:', error); // Log any error
            }
        };

        // Read file based on its type
        if (extension === 'xlsx' || extension === 'xls') {
            reader.readAsArrayBuffer(file);
        } else if (extension === 'csv' || extension === 'txt') {
            reader.readAsText(file);
        }
    }

    // Show the search bar
    function showSearchBar() {
        const searchContainer = document.getElementById('searchContainer');
        searchContainer.classList.remove('hidden');
    }

    // Enable resizing
    function enableResizing() {
        // Create a resize handle
        resizeHandle = document.createElement('div');
        resizeHandle.classList.add('resize-handle');
        container.appendChild(resizeHandle); // Add the resize handle to the container

        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            isResizing = true;
        });

        document.addEventListener('mouseup', () => {
            isResizing = false;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;

            const containerRect = container.getBoundingClientRect();
            const newWidth = e.clientX - containerRect.left;
            const newHeight = e.clientY - containerRect.top;

            // Set minimum size constraints
            if (newWidth > 400) {
                container.style.width = Math.min(window.innerWidth, newWidth) + 'px'; // Allow full width
            }
            if (newHeight > 300) {
                container.style.height = newHeight + 'px';
            }
        });
    }

    // Display the data in the table
    function displayData(data) {
        const output = document.getElementById('output');
        output.innerHTML = '';

        const table = document.createElement('table');
        data.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            row.forEach((cell, columnIndex) => {
                const td = document.createElement('td');
                td.textContent = cell;
                td.setAttribute('data-row', rowIndex);
                td.setAttribute('data-col', columnIndex);
                if (cell !== '') {
                    td.classList.add('non-empty');
                }
                tr.appendChild(td);
            });
            table.appendChild(tr);
        });

        // Add event listener to each non-empty cell
        table.addEventListener('click', function (e) {
            const target = e.target;
            if (target.tagName === 'TD' && target.classList.contains('non-empty')) {
                copyToClipboard(target.textContent);
                highlightCell(target); // Highlight the clicked cell
            }
        });

        output.appendChild(table);
    }

    // Function to handle search
    function handleSearch() {
        const searchText = searchInput.value.trim().toLowerCase();
        const cells = document.querySelectorAll('td.non-empty');
        let firstMatch = null;

        cells.forEach(cell => {
            const text = cell.textContent.toLowerCase();
            if (searchText === '' || !text.includes(searchText)) {
                cell.classList.remove('highlight');
            } else {
                cell.classList.add('highlight');
                if (!firstMatch) {
                    firstMatch = cell;
                }
            }
        });

        // Scroll to the first matching cell
        if (firstMatch) {
            scrollToVisible(firstMatch);
        }
    }

    // Scroll the element into view
    function scrollToVisible(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }

    // Copy text to clipboard
    function copyToClipboard(value) {
        const textarea = document.createElement('textarea');
        textarea.value = value.trim();
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showAlert(`Copied! - "${textarea.value}"`, 'success');
    }

    // Show alert
    function showAlert(message, type) {
        const toast = document.createElement('div');
        toast.classList.add('toast', type);
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 2000);
        }, 100);
    }

    // Highlight the clicked cell
    function highlightCell(cell) {
        if (lastClickedCell) {
            lastClickedCell.classList.remove('last-clicked');
        }
        cell.classList.add('last-clicked');
        lastClickedCell = cell;
    }
});
