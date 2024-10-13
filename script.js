// Bread Sheet - Main JavaScript
// Developer: Ajay Singh
// Version: 1.0
// Date: 04-06-2024
// Description: This script handles file reading (Excel/CSV), displays data in a table,
//              provides search functionality, and allows resizing of the main container.

document.addEventListener('DOMContentLoaded', init);

function init() {
    const fileInput = document.getElementById('fileInput');
    const searchContainer = document.querySelector('.search-bar');
    const searchInput = document.getElementById('searchInput');
    const container = document.querySelector('.container');
    const addFileButton = document.getElementById('addFileButton');
    
    let resizeHandle, data = [], lastClickedCell = null, isResizing = false;

    // Event Listeners
    fileInput.addEventListener('change', handleFileUpload);
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    addFileButton.addEventListener('click', () => fileInput.click());
    document.getElementById('projectTitle').addEventListener('click', refreshPage);
    document.getElementById('projectTitle').addEventListener('mousedown', handleTitleMouseDown);

    // Initially hide the search bar
    searchContainer.classList.remove('visible');

    function handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return showAlert("No file selected.", "error");

        const reader = new FileReader();
        const extension = file.name.split('.').pop().toLowerCase();

        if (!isValidFileType(extension)) return showAlert('Unsupported file type. Please upload an Excel or CSV file.', 'error');

        reader.onload = (e) => loadData(e.target.result, extension);
        const readMethod = ['xlsx', 'xls'].includes(extension) ? 'readAsArrayBuffer' : 'readAsText';
        reader[readMethod](file); // Dynamically call read method
    }

    function loadData(rawData, extension) {
        try {
            const workbook = extension === 'xlsx' || extension === 'xls' 
                ? XLSX.read(new Uint8Array(rawData), { type: 'array' })
                : XLSX.read(rawData, { type: 'string' });

            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

            displayData(data);
            showSearchBar();
            enableResizing();
            container.style.width = '100%';
        } catch (error) {
            showAlert('Error reading file: ' + error.message, 'error');
            console.error('Error reading file:', error);
        }
    }

    function isValidFileType(extension) {
        return ['xlsx', 'xls', 'csv', 'txt'].includes(extension);
    }

    function showSearchBar() {
        searchContainer.classList.add('visible'); // Show search bar
        searchInput.disabled = false; // Enable search input
    }

    // Resizing Functionality
    function enableResizing() {
        resizeHandle = createResizeHandle();
        container.appendChild(resizeHandle);
        addResizeListeners();
    }

    function createResizeHandle() {
        const handle = document.createElement('div');
        handle.classList.add('resize-handle');
        return handle;
    }

    function addResizeListeners() {
        resizeHandle.addEventListener('mousedown', () => (isResizing = true));
        document.addEventListener('mouseup', () => (isResizing = false));
        document.addEventListener('mousemove', resizeContainer);
    }

    function resizeContainer(event) {
        if (!isResizing) return;

        const { left, top } = container.getBoundingClientRect();
        const newWidth = Math.min(window.innerWidth, Math.max(400, event.clientX - left)) + 'px';
        const newHeight = Math.max(300, event.clientY - top) + 'px';

        container.style.width = newWidth;
        container.style.height = newHeight;
    }

    // Search Functionality
    function handleSearch() {
        const searchText = searchInput.value.trim().toLowerCase();
        const cells = document.querySelectorAll('td.non-empty');
        let firstMatch = null;

        cells.forEach(cell => {
            const text = cell.textContent.toLowerCase();
            const isMatch = searchText && text.includes(searchText);
            cell.classList.toggle('highlight', isMatch);

            if (isMatch && !firstMatch) firstMatch = cell; // Set the first match
        });

        if (searchText === '') scrollToTop(); // Scroll to the top if the search is cleared
        else if (firstMatch) setTimeout(() => scrollToVisible(firstMatch), 200); // Scroll to first match
    }

    function scrollToVisible(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    }

    function scrollToTop() {
        document.getElementById('output').scrollTo({ top: 0, behavior: 'smooth' });
    }

    function debounce(func, delay) {
        let timeout;
        return function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), delay);
        };
    }

    // Page Refresh Functionality
    function refreshPage() {
        location.reload(); // Refresh the page
    }

    function handleTitleMouseDown(event) {
        if (event.button === 0) refreshPage(); // Left click refresh
        else if (event.button === 1) openNewPage(); // Middle click open a new page
    }

    function openNewPage() {
        window.open("https://ajayparihar.github.io/Bread-Sheet", '_blank'); // Open new page
    }

    // Data Display Functions
    function displayData(data) {
        const output = document.getElementById('output');
        output.innerHTML = ''; // Clear previous data

        const table = document.createElement('table');
        data.forEach((row, rowIndex) => createTableRow(row, rowIndex, table));
        output.appendChild(table); // Append table to output
    }

    function createTableRow(row, rowIndex, table) {
        const tr = document.createElement('tr');
        row.forEach((cell, columnIndex) => {
            const td = createTableCell(cell, rowIndex, columnIndex);
            tr.appendChild(td);
        });
        table.appendChild(tr); // Append row to table
    }

    function createTableCell(cell, rowIndex, columnIndex) {
        const td = document.createElement('td');
        td.textContent = cell;
        td.dataset.row = rowIndex;
        td.dataset.col = columnIndex;
        if (cell !== '') td.classList.add('non-empty');
        td.addEventListener('click', () => handleCellClick(td));
        return td; // Return the created table cell
    }

    function handleCellClick(cell) {
        if (cell.classList.contains('non-empty')) {
            copyToClipboard(cell.textContent); // Copy cell content
            highlightCell(cell); // Highlight the clicked cell
        }
    }

    function copyToClipboard(value) {
        navigator.clipboard.writeText(value.trim())
            .then(() => showAlert(`Copied! - "${value.trim()}"`, 'success'))
            .catch(err => showAlert('Failed to copy text: ' + err, 'error'));
    }

    function highlightCell(cell) {
        if (lastClickedCell) lastClickedCell.classList.remove('last-clicked');
        cell.classList.add('last-clicked'); // Highlight the last clicked cell
        lastClickedCell = cell;
    }

    function showAlert(message, type) {
        // Check for an existing toast and remove it
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.classList.remove('show'); // Start hiding the existing toast
            setTimeout(() => {
                document.body.removeChild(existingToast); // Remove it from the DOM after the transition
            }, 300); // Match the transition duration in CSS
        }

        // Create a new toast
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast); // Show alert

        setTimeout(() => toast.classList.add('show'), 100); // Delay the show to allow DOM rendering
        setTimeout(() => {
            toast.classList.remove('show'); // Start hiding the new toast
            setTimeout(() => {
                document.body.removeChild(toast); // Remove it from the DOM after the transition
            }, 300); // Match the transition duration in CSS
        }, 2300); // Toast duration before hiding
    }
}
