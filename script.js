// Developer: Ajay Singh
// Version: 1st version
// Date: 2024-06-04

document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('fileInput');
    const searchInput = document.getElementById('searchInput');
    let data = []; // Initialize with an empty array

    // Event listeners
    fileInput.addEventListener('change', handleFile, false);
    searchInput.addEventListener('input', handleSearch, false);
    document.querySelector('.container h1').addEventListener('click', refreshPage, false);
    document.querySelector('.container h1').addEventListener('auxclick', openNewTabInBackground, false);

    // Function to handle file import
    function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        const extension = file.name.split('.').pop().toLowerCase();

        reader.onload = (event) => {
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
            displayData(data);
            showSearchBar(); // Show search bar after file is imported

            // Save data to localStorage if needed
            // saveToLocalStorage(data);
        };

        if (extension === 'xlsx' || extension === 'xls') {
            reader.readAsArrayBuffer(file);
        } else if (extension === 'csv' || extension === 'txt') {
            reader.readAsText(file);
        }
    }

    // Function to display data in table
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
        table.addEventListener('click', function(e) {
            const target = e.target;
            if (target.tagName === 'TD' && target.classList.contains('non-empty')) {
                copyToClipboard(target.textContent);
            }
        });

        output.appendChild(table);
    }

    // Function to show search bar
    function showSearchBar() {
        const searchBar = document.querySelector('.search-bar');
        searchBar.classList.remove('hidden');
    }

    // Function to handle search
    function handleSearch() {
        const searchText = document.getElementById('searchInput').value.trim().toLowerCase(); // Trim whitespace

        const cells = document.querySelectorAll('td.non-empty');

        cells.forEach(cell => {
            const text = cell.textContent.toLowerCase();
            const rowIndex = parseInt(cell.getAttribute('data-row'));
            const colIndex = parseInt(cell.getAttribute('data-col'));
            if (searchText === '' || !text.includes(searchText)) {
                cell.classList.remove('highlight');
            } else {
                cell.classList.add('highlight');
            }
        });
    }

    // Function to copy to clipboard
    function copyToClipboard(value) {
        const trimmedValue = value.trim(); // Remove leading and trailing spaces
        const textarea = document.createElement('textarea');
        textarea.value = trimmedValue;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);

        showAlert(`Copied! - "${trimmedValue}"`, 'success');
    }

    // Function to show alert
    function showAlert(message, type) {
        const toast = document.createElement('div');
        toast.classList.add('toast');
        toast.classList.add(type);
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300); // Remove toast after transition ends
            }, 2000); // Show toast for 2 seconds
        }, 100); // Delay before showing toast
    }

    // Function to refresh the page
    function refreshPage() {
        location.reload();
    }

    // Function to open a new tab in the background
    function openNewTabInBackground(event) {
        // Check if the mouse wheel (button 1) is pressed
        if (event.button === 1) {
            const newTab = window.open(window.location.href, '_blank');
            if (newTab) {
                newTab.blur(); // Blur the new tab to open it in the background
                window.focus(); // Focus back on the current tab
            }
        }
    }
});
