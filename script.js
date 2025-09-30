// Bread Sheet - Main JavaScript
// Developer: Ajay Singh
// Version: 1.2
// Date: 04-06-2024
// Description: This script handles file reading (Excel/CSV), displays data in a table,
//              and supports the enhanced glassomorphic UI design.

document.addEventListener("DOMContentLoaded", init);

// Helper function to detect mobile devices
function isMobileDevice() {
  // Better mobile detection using both screen size and user agent
  const isMobileBySize = window.innerWidth <= 800;
  
  // Check for mobile user agent patterns
  const isMobileByUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  // Consider it mobile if either condition is true
  return isMobileBySize && isMobileByUA;
}

function init() {
  // DOM Elements
  const fileInput = document.getElementById("fileInput");
  const welcomePage = document.getElementById("welcomePage");
  const dataView = document.getElementById("dataView");
  const uploadArea = document.getElementById("uploadArea");
  const searchContainer = document.getElementById("searchContainer");
  const searchInput = document.getElementById("searchInput");
  const clearSearch = document.getElementById("clearSearch");
  const themeToggle = document.getElementById("themeToggle");
  const importButton = document.getElementById("importButton");
  const exportButton = document.getElementById("exportButton");
  const toolsButton = document.getElementById("toolsButton");
  const refreshButton = document.getElementById("refreshButton");
  const keyboardShortcutsButton = document.getElementById("showKeyboardShortcuts");
  const browseButton = document.getElementById("browseButton");

  // Constants for local storage keys
  const STORAGE_KEYS = {
    THEME: "breadSheetTheme"
  };

  // Initially show welcome page
  welcomePage.style.display = 'flex';
  dataView.style.display = 'none';
  
  // Initially disable buttons that require data
  exportButton.disabled = true;
  refreshButton.disabled = true;

  let data = [],
    lastClickedCell = null,
    currentWorkbook = null,
    currentSheetName = "",
    isDarkTheme = true,
    currentFileName = "",
    currentFile = null,
    originalData = [], 
    isRefreshing = false,
    currentFocusedCell = null,
    isEditing = false,    // Flag to track if a cell is being edited
    editingCell = null,   // Reference to the cell being edited
    clickTimer = null;    // Timer to handle single vs double click

  // Initialize settings from localStorage
  initializeSettings();

  // Event Listeners
  fileInput.addEventListener("change", handleFileUpload);
  importButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });
  uploadArea.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });
  browseButton.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    fileInput.click();
  });
  
  // Search functionality
  searchInput.addEventListener("input", debounce(handleSearch, 300));
  clearSearch.addEventListener("click", clearSearchResults);
  
  // Navigation event listeners
  document.getElementById("projectTitle").addEventListener("click", refreshPage);
  themeToggle.addEventListener("click", toggleTheme);
  refreshButton.addEventListener("click", handleRefresh);
  keyboardShortcutsButton.addEventListener("click", showKeyboardShortcutsLegend);
  
  
  // Dropdown functionality
  setupDropdowns();

  // Drag-and-Drop Event Listeners
  setupDragAndDrop();

  
  // Setup dropdown functionality
  function setupDropdowns() {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
      const button = dropdown.querySelector('.nav-button, .action-button');
      const menu = dropdown.querySelector('.dropdown-menu');
      
      if (button && menu) {
        button.addEventListener('click', (e) => {
          e.stopPropagation();
          // Close other dropdowns
          dropdowns.forEach(d => {
            if (d !== dropdown) {
              d.classList.remove('active');
              const btn = d.querySelector('.nav-button, .action-button');
              if (btn) btn.setAttribute('aria-expanded', 'false');
            }
          });
          
          // Toggle current dropdown
          dropdown.classList.toggle('active');
          button.setAttribute('aria-expanded', dropdown.classList.contains('active'));
        });
        
        // Handle dropdown item clicks
        menu.querySelectorAll('.dropdown-item').forEach(item => {
          item.addEventListener('click', () => {
            const format = item.getAttribute('data-format');
            if (format) {
              exportData(format);
            }
            dropdown.classList.remove('active');
            button.setAttribute('aria-expanded', 'false');
          });
        });
      }
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
      dropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
        const button = dropdown.querySelector('.nav-button, .action-button');
        if (button) button.setAttribute('aria-expanded', 'false');
      });
    });
  }
  
  // Setup drag and drop functionality
  function setupDragAndDrop() {
    const dragElements = [uploadArea, document.body];
    
    dragElements.forEach(element => {
      element.addEventListener('dragover', handleDragOver);
      element.addEventListener('drop', handleFileDrop);
      element.addEventListener('dragenter', handleDragEnter);
      element.addEventListener('dragleave', handleDragLeave);
    });
  }
  
  // Handle search functionality
  function handleSearch() {
    const searchText = searchInput.value.trim();
    
    // Show/hide clear button
    clearSearch.classList.toggle('visible', searchText.length > 0);
    
    if (searchText === '') {
      // Clear all highlights
      clearSearchResults();
      return;
    }
    
    const cells = document.querySelectorAll('td');
    let firstMatch = null;
    let matchCount = 0;
    
    cells.forEach(cell => {
      const cellText = cell.textContent.toLowerCase();
      const isMatch = cellText.includes(searchText.toLowerCase());
      
      if (isMatch) {
        // Add highlight class and create visual highlight within the cell
        cell.classList.add('search-highlight');
        highlightTextInCell(cell, searchText);
        matchCount++;
        
        if (!firstMatch) {
          firstMatch = cell;
        }
      } else {
        // Remove highlight and restore original text
        cell.classList.remove('search-highlight');
        restoreOriginalCellText(cell);
      }
    });
    
    // Update search results count in ARIA live region
    announceSearchResults(matchCount, searchText);
    
    // Scroll to first match
    if (firstMatch) {
      setTimeout(() => scrollToVisible(firstMatch), 200);
    }
  }
  
  // Clear search results
  function clearSearchResults() {
    searchInput.value = '';
    clearSearch.classList.remove('visible');
    
    // Remove search highlights and restore original text
    const highlightedCells = document.querySelectorAll('td.search-highlight');
    highlightedCells.forEach(cell => {
      cell.classList.remove('search-highlight');
      restoreOriginalCellText(cell);
    });
    
    // Clear search results announcement
    announceForScreenReaders('Search cleared');
  }
  
  
  // Show/hide search bar based on data state
  function toggleSearchBar(show) {
    searchContainer.classList.toggle('visible', show);
  }
  
  // Switch between welcome page and data view
  function showWelcomePage() {
    welcomePage.style.display = 'flex';
    dataView.style.display = 'none';
    toggleSearchBar(false);
    exportButton.disabled = true;
    refreshButton.disabled = true;
  }
  
  function showDataView() {
    welcomePage.style.display = 'none';
    dataView.style.display = 'block';
    toggleSearchBar(true);
    exportButton.disabled = false;
    refreshButton.disabled = false;
  }
  
  // Handle file refresh
  function handleRefresh() {
    if (!currentFile || isRefreshing) return;
    
    // Set refreshing state
    isRefreshing = true;
    refreshButton.classList.add("refreshing");
    
    // Show loading indicator with refresh message
    showLoadingIndicator('Refreshing data from file...');
    
    // Verify file is still accessible
    if (currentFile.size === 0) {
      showToast("Error: File appears to be empty or inaccessible.", "error");
      resetRefreshState();
      hideLoadingIndicator();
      return;
    }
    
    // Read the file again
    const fileNameParts = currentFileName.split('.');
    const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
    
    const reader = new FileReader();
    
    reader.onerror = () => {
      showToast("Error reading file during refresh.", "error");
      resetRefreshState();
      hideLoadingIndicator();
    };
    
    reader.onload = (e) => {
      try {
        if (!e.target.result || (Array.isArray(e.target.result) && e.target.result.length === 0)) {
          hideLoadingIndicator();
          throw new Error("File appears to be empty or corrupted.");
        }
        refreshData(e.target.result, fileExtension);
        showToast("Data refreshed successfully!", "success");
      } catch (error) {
        showToast("Error refreshing data: " + error.message, "error");
        console.error("Refresh error:", error);
      } finally {
        resetRefreshState();
        hideLoadingIndicator();
      }
    };
    
    if (fileExtension === 'csv' || fileExtension === 'txt') {
      reader.readAsText(currentFile);
    } else {
      reader.readAsArrayBuffer(currentFile);
    }
  }
  
  // Reset refresh button state
  function resetRefreshState() {
    isRefreshing = false;
    refreshButton.classList.remove("refreshing");
  }
  
  // Refresh data from file
  function refreshData(rawData, extension) {
    let workbook;
    
    // Handle different file types
    if (extension === "csv") {
      workbook = XLSX.read(rawData, { type: "string", raw: true });
    } else if (extension === "txt") {
      workbook = XLSX.read(rawData, { type: "string", raw: true });
    } else {
      workbook = ["xlsx", "xls"].includes(extension)
        ? XLSX.read(new Uint8Array(rawData), { type: "array" })
        : null;
    }
    
    if (!workbook) {
      throw new Error("Unsupported file format or error parsing file.");
    }
    
    // Update the workbook
    currentWorkbook = workbook;
    
    // If the sheet no longer exists in the refreshed file, use the first sheet
    if (!workbook.SheetNames.includes(currentSheetName)) {
      currentSheetName = workbook.SheetNames[0];
    }
    
    // Update sheet selector if exists and sheet names changed
    const sheetSelector = document.getElementById("sheetSelector");
    if (sheetSelector && workbook.SheetNames.length > 1) {
      createSheetSelector(workbook.SheetNames);
      
      // Set the current sheet as active tab
      const tabs = document.querySelectorAll(".sheet-tab");
      tabs.forEach(tab => {
        if (tab.dataset.sheet === currentSheetName) {
          tab.classList.add("active");
        } else {
          tab.classList.remove("active");
        }
      });
    }
    
    // Load the current sheet data
    loadSheet(currentSheetName);
    
    // Initialize keyboard navigation
    initKeyboardNavigation();
  }
  
  // Initialize all settings from localStorage
  function initializeSettings() {
    // Initialize theme
    initializeTheme();
  }
  
  // Export data to different formats
  function exportData(format) {
    try {
      if (!data || data.length === 0) {
        return showToast("No data to export.", "error");
      }
      
      // Validate format
      const validFormats = ["xlsx", "csv", "txt", "html"];
      if (!validFormats.includes(format)) {
        return showToast(`Unsupported export format: ${format}`, "error");
      }
      
      // Generate filename with current date and time
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").substring(0, 19);
      const baseFileName = currentFileName ? currentFileName.split(".")[0] : "bread-sheet-export";
      const fileName = `${baseFileName}-${timestamp}`;
      
      switch (format) {
        case "xlsx":
          exportToExcel(fileName);
          break;
        case "csv":
          exportToCSV(fileName);
          break;
        case "txt":
          exportToText(fileName);
          break;
        case "html":
          exportToHTML(fileName);
          break;
        default:
          // This should never execute due to validation above
          showToast("Unexpected export format.", "error");
      }
    } catch (error) {
      showToast(`Export failed: ${error.message}`, "error");
      console.error("Export error:", error);
    }
  }
  
  // Export to Excel
  function exportToExcel(fileName) {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert data to worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, currentSheetName || "Sheet1");
    
    // Generate Excel file and trigger download
    XLSX.writeFile(wb, `${fileName}.xlsx`);
    showToast("Exported to Excel successfully!", "success");
  }
  
  // Export to CSV
  function exportToCSV(fileName) {
    // Convert data to CSV string
    const csvContent = data.map(row => 
      row.map(cell => {
        // Convert cell to string if it's not already
        const cellStr = cell !== null && cell !== undefined ? String(cell) : '';
        
        // Check if cell needs to be quoted (contains commas, quotes, or newlines)
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          // Escape quotes by doubling them and wrap in quotes
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
    
    // Create and download the file
    downloadFile(csvContent, `${fileName}.csv`, 'text/csv');
    showToast("Exported to CSV successfully!", "success");
  }
  
  // Export to plain text
  function exportToText(fileName) {
    // Convert data to tab-delimited text
    const textContent = data.map(row => row.join('\t')).join('\n');
    
    // Create and download the file
    downloadFile(textContent, `${fileName}.txt`, 'text/plain');
    showToast("Exported to text successfully!", "success");
  }
  
  // Export to HTML
  function exportToHTML(fileName) {
    // Create HTML table structure
    let htmlContent = '<!DOCTYPE html>\n<html>\n<head>\n';
    htmlContent += '<meta charset="UTF-8">\n';
    htmlContent += `<title>${fileName}</title>\n`;
    htmlContent += '<style>\n';
    htmlContent += 'table { border-collapse: collapse; width: 100%; }\n';
    htmlContent += 'th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }\n';
    htmlContent += 'tr:nth-child(even) { background-color: #f2f2f2; }\n';
    htmlContent += 'th { background-color: #4CAF50; color: white; }\n';
    htmlContent += '</style>\n</head>\n<body>\n';
    htmlContent += '<table>\n';
    
    // Add table data
    data.forEach((row, rowIndex) => {
      htmlContent += '<tr>\n';
      row.forEach(cell => {
        // Use th for header row, td for other rows
        const cellTag = rowIndex === 0 ? 'th' : 'td';
        htmlContent += `  <${cellTag}>${cell}</${cellTag}>\n`;
      });
      htmlContent += '</tr>\n';
    });
    
    htmlContent += '</table>\n</body>\n</html>';
    
    // Create and download the file
    downloadFile(htmlContent, `${fileName}.html`, 'text/html');
    showToast("Exported to HTML successfully!", "success");
  }
  
  // Helper function to download file
  function downloadFile(content, fileName, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    // Safety check before removing
    if (a.parentNode === document.body) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }
  
  // Initialize theme based on stored preference or system preference
  function initializeTheme() {
    // Get stored theme
    const storedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    
    if (storedTheme) {
      // Use stored preference
      isDarkTheme = storedTheme === "dark";
    } else {
      // Check for system preference
      const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
      isDarkTheme = prefersDarkScheme;
    }
    
    // Apply theme
    applyTheme();
  }
  
  // Apply the selected theme
  function applyTheme() {
    const themeToggle = document.getElementById("themeToggle");
    const sunIcon = document.querySelector(".sun-icon");
    const moonIcon = document.querySelector(".moon-icon");
    
    // Apply theme class to body
    if (isDarkTheme) {
      document.body.classList.remove("light-theme");
      document.querySelector('meta[name="theme-color"]').setAttribute("content", "#131313");
      // Show sun icon in dark mode (to switch to light)
      if (sunIcon) sunIcon.style.display = "block";
      if (moonIcon) moonIcon.style.display = "none";
      if (themeToggle) {
        themeToggle.setAttribute("title", "Switch to light theme (Ctrl+T)");
        themeToggle.setAttribute("aria-label", "Switch to light theme");
        themeToggle.setAttribute("aria-pressed", "true");
      }
    } else {
      document.body.classList.add("light-theme");
      document.querySelector('meta[name="theme-color"]').setAttribute("content", "#FDFDFD");
      // Show moon icon in light mode (to switch to dark)
      if (sunIcon) sunIcon.style.display = "none";
      if (moonIcon) moonIcon.style.display = "block";
      if (themeToggle) {
        themeToggle.setAttribute("title", "Switch to dark theme (Ctrl+T)");
        themeToggle.setAttribute("aria-label", "Switch to dark theme");
        themeToggle.setAttribute("aria-pressed", "false");
      }
    }
  }
  
  // Toggle between light and dark themes
  function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    localStorage.setItem(STORAGE_KEYS.THEME, isDarkTheme ? "dark" : "light");
    
    // Add transition class for smooth theme change
    document.body.classList.add("theme-transition");
    
    // Force a repaint to ensure transitions work
    document.body.offsetHeight;
    
    // Apply theme
    applyTheme();
    
    // Update drag-drop instructions and image display if present
    const dragDropInstructions = document.querySelector(".drag-drop-instructions");
    const imageDisplay = document.querySelector("#output.image-display");
    const randomImage = document.querySelector(".random-background-image");
    
    if (dragDropInstructions) {
      dragDropInstructions.style.transition = "all 0.3s ease";
    }
    
    if (imageDisplay) {
      imageDisplay.style.transition = "all 0.3s ease";
    }
    
    if (randomImage) {
      randomImage.style.transition = "all 0.3s ease";
    }
    
    // Remove transition class after animation completes
    setTimeout(() => {
      document.body.classList.remove("theme-transition");
      
      // Reset transition properties
      if (dragDropInstructions) {
        dragDropInstructions.style.transition = "";
      }
      if (imageDisplay) {
        imageDisplay.style.transition = "";
      }
      if (randomImage) {
        randomImage.style.transition = "";
      }
    }, 500);
    
    // Announce theme change for screen readers
    announceForScreenReaders(`Switched to ${isDarkTheme ? "dark" : "light"} theme`);
  }

  // Loading state management variables
  let isLoading = false;
  let loadingTimeout = null;

  // Update the loading indicator functionality
  function showLoadingIndicator(message = 'Loading your file...', showProgress = false) {
    // Prevent showing loading indicator if already loading
    if (isLoading) return;
    
    isLoading = true;
    const loadingIndicator = document.getElementById('loadingIndicator');
    const loadingText = loadingIndicator.querySelector('.loading-text');
    const loadingProgress = loadingIndicator.querySelector('.loading-progress');
    
    // Update loading text with custom message
    loadingText.textContent = message;
    
    // Show/hide progress bar
    if (loadingProgress) {
      loadingProgress.style.display = showProgress ? 'block' : 'none';
      if (showProgress) {
        updateLoadingProgress(0);
      }
    }
    
    loadingIndicator.style.display = 'flex';
    
    // Add visible class after a small delay for the animation to work
    setTimeout(() => {
      loadingIndicator.classList.add('visible');
    }, 10);
    
    // Announce for screen readers
    announceForScreenReaders(message);
  }

  function hideLoadingIndicator() {
    // Clear any pending loading timeout
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
      loadingTimeout = null;
    }
    
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // First remove the visible class to trigger the fade out animation
    loadingIndicator.classList.remove('visible');
    
    // Then hide the element after the animation completes
    loadingTimeout = setTimeout(() => {
      loadingIndicator.style.display = 'none';
      isLoading = false; // Reset loading state
    }, 300);
  }
  
  // Update loading progress
  function updateLoadingProgress(percentage) {
    const progressBar = document.querySelector('.loading-progress-bar');
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
    }
  }

  // Update the handleFileUpload function
  function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      showToast(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 10MB limit. Please use a smaller file.`, 'error');
      return;
    }
    
    currentFile = file;
    currentFileName = file.name;
    
    // Get the file extension
    const fileNameParts = file.name.split('.');
    const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
    
    // Check if the file type is valid
    if (!isValidFileType(fileExtension)) {
      const supportedFormats = 'Excel (.xlsx, .xls), CSV (.csv), or text (.txt)';
      showToast(`Unsupported file type: ".${fileExtension}". Please use ${supportedFormats} files.`, 'error');
      announceForScreenReaders(`File type ${fileExtension} is not supported. Please use supported formats: ${supportedFormats}`);
      return;
    }
    
    // Show loading indicator with file-specific message and progress bar for larger files
    const fileType = fileExtension.toUpperCase();
    const fileSizeKB = (file.size / 1024).toFixed(0);
    const showProgress = file.size > 1024 * 1024; // Show progress for files > 1MB
    showLoadingIndicator(`Processing ${fileType} file (${fileSizeKB}KB)...`, showProgress);
    
    // Read the file
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const fileData = e.target.result;
      loadData(fileData, fileExtension);
    };
    
    reader.onerror = function() {
      hideLoadingIndicator();
      showToast('Error reading file. Please try again.', 'error');
    };
    
    if (fileExtension === 'csv' || fileExtension === 'txt') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  // Handle file drop
  function handleFileDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.remove("drag-over");
    
    // Show warning if multiple files were dropped
    if (event.dataTransfer.files.length > 1) {
      showToast("Multiple files detected. Only the first file will be processed.", "warning");
    }
    
    const file = event.dataTransfer.files[0];
    if (!file) {
      showToast("No file detected. Please try again.", "error");
      return;
    }
    
    // File size validation (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      showToast(`File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds the 10MB limit. Please use a smaller file.`, 'error');
      return;
    }
    
    // Store the file name and file object for later use
    currentFileName = file.name;
    currentFile = file;

    // Get the file extension
    const fileNameParts = file.name.split('.');
    const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
    
    // Check if the file type is valid
    if (!isValidFileType(fileExtension)) {
      const supportedFormats = 'Excel (.xlsx, .xls), CSV (.csv), or text (.txt)';
      showToast(`Unsupported file type: ".${fileExtension}". Please use ${supportedFormats} files.`, 'error');
      announceForScreenReaders(`File type ${fileExtension} is not supported. Please use supported formats: ${supportedFormats}`);
      return;
    }
    
    // Show loading indicator with file-specific message and progress bar for larger files
    const fileType = fileExtension.toUpperCase();
    const fileSizeKB = (file.size / 1024).toFixed(0);
    const showProgress = file.size > 1024 * 1024; // Show progress for files > 1MB
    showLoadingIndicator(`Processing ${fileType} file (${fileSizeKB}KB)...`, showProgress);
    
    // Read the file
    const reader = new FileReader();
    reader.onerror = () => {
      hideLoadingIndicator();
      showToast("Error reading file.", "error");
    };

    reader.onload = (e) => loadData(e.target.result, fileExtension);
    
    if (fileExtension === 'csv' || fileExtension === 'txt') {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  // Prevent default behavior for drag over
  function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
  }

  // Highlight drag-and-drop area on drag enter
  function handleDragEnter(event) {
    event.preventDefault();
    event.stopPropagation();
    if (uploadArea && uploadArea.contains(event.target)) {
      uploadArea.classList.add("drag-over");
    }
  }
  
  // Handle drag leave
  function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    if (uploadArea && !uploadArea.contains(event.relatedTarget)) {
      uploadArea.classList.remove("drag-over");
    }
  }

  // Function to handle loading of data from file
  function loadData(fileData, fileExtension) {
    try {
      // Check if XLSX is loaded
      if (typeof XLSX === "undefined") {
        hideLoadingIndicator();
        throw new Error("XLSX library is not available. Please refresh the page and try again.");
      }
      
      // Reset any existing data
      cleanupMemory();

      // Parse the file based on its extension
      let parsedData;
      if (fileExtension === "csv") {
        parsedData = parseCSV(fileData);
      } else if (fileExtension === "txt") {
        parsedData = parseTXT(fileData);
      } else if (["xlsx", "xls"].includes(fileExtension)) {
        parsedData = parseExcel(fileData);
      } else {
        hideLoadingIndicator();
        throw new Error("Unsupported file format: " + fileExtension);
      }

      if (!parsedData || parsedData.length === 0) {
        hideLoadingIndicator();
        showToast("No data found in file", "error");
        return;
      }

      // Save the original data for refreshing
      originalData = parsedData.map(row => [...row]);
      
      // Store parsed data and update UI
      data = parsedData;
      
      // Reset output styling that was set for the random image
      const output = document.getElementById("output");
      output.style.padding = "";
      output.style.overflow = "";
      output.style.height = "";
      output.classList.remove("image-display");
      
      displayData(parsedData);
      
      // Switch to data view
      showDataView();
      
      // Setup keyboard navigation
      initKeyboardNavigation();
      
      // Hide loading indicator first, then show success message
      hideLoadingIndicator();
      
      // Show success message after loading indicator is hidden
      setTimeout(() => {
        showToast("File loaded successfully!", "success");
      }, 350);
      
      // Reset file input to allow re-importing the same file
      // Note: Reset with a small delay to ensure the import process completes
      setTimeout(() => {
        if (!isRefreshing) {
          fileInput.value = "";
        }
      }, 100);
      
    } catch (error) {
      console.error("Error processing file:", error);
      showToast("Error processing file: " + error.message, "error");
      hideLoadingIndicator();
      // Reset file input with delay to allow error handling to complete
      setTimeout(() => {
        fileInput.value = "";
      }, 100);
    }
  }

  // Clean up memory to prevent memory leaks
  function cleanupMemory() {
    // Clear data arrays
    data = [];
    originalData = [];
    
    // Clear UI elements here as needed
    // We'll just clean up event listeners and other references
    
    // Remove old sheet selector if it exists
    const oldSheetSelector = document.getElementById("sheetSelector");
    if (oldSheetSelector) {
      oldSheetSelector.remove();
    }
    
    // Reset file input if needed
    // Only reset when not refreshing and with a delay to prevent timing issues
    if (!isRefreshing) {
      setTimeout(() => {
        fileInput.value = "";
      }, 100);
    }
    
    // Remove event listeners from previous tables
    const oldTable = document.querySelector("table");
    if (oldTable) {
      const oldCells = oldTable.querySelectorAll("td");
      oldCells.forEach(cell => {
        // Clone and replace to remove event listeners
        const newCell = cell.cloneNode(true);
        if (cell.parentNode) {
          cell.parentNode.replaceChild(newCell, cell);
        }
      });
    }
    
    // Force garbage collection in supporting browsers
    if (window.gc) {
      window.gc();
    } else {
      // Alternative approach for browsers without explicit GC
      const largeObject = [];
      for (let i = 0; i < 1000000; i++) {
        largeObject.push(i);
      }
    }
  }
  
  // Unload data when switching to a different file
  function unloadData() {
    cleanupMemory();
    currentWorkbook = null;
    currentSheetName = "";
    currentFileName = "";
    currentFile = null;
    
    
    // Clear content and show welcome page
    const output = document.getElementById("output");
    output.innerHTML = "";
    
    // Show welcome page
    showWelcomePage();
  }
  
  // Create sheet selector dropdown
  function createSheetSelector(sheetNames) {
    // Remove existing selector if it exists
    const existingSelector = document.getElementById("sheetSelector");
    if (existingSelector && existingSelector.parentNode) {
      existingSelector.parentNode.removeChild(existingSelector);
    }
    
    // Create selector container
    const selectorContainer = document.createElement("div");
    selectorContainer.id = "sheetSelector";
    selectorContainer.className = "sheet-tabs-container";
    
    // Create sheet tabs
    const tabsList = document.createElement("ul");
    tabsList.className = "sheet-tabs";
    tabsList.setAttribute("role", "tablist");
    
    // Add tabs for each sheet
    sheetNames.forEach((sheetName, index) => {
      const tab = document.createElement("li");
      tab.className = "sheet-tab";
      tab.textContent = sheetName;
      tab.dataset.sheet = sheetName;
      tab.setAttribute("role", "tab");
      tab.setAttribute("tabindex", sheetName === currentSheetName ? "0" : "-1");
      tab.setAttribute("aria-selected", sheetName === currentSheetName ? "true" : "false");
      tab.id = `tab-${sheetName.replace(/\s+/g, '-')}`;
      
      // Set active tab
      if (sheetName === currentSheetName) {
        tab.classList.add("active");
      }
      
      // Add event listener for tab click
      tab.addEventListener("click", () => {
        switchToSheet(sheetName);
      });
      
      // Add keyboard navigation
      tab.addEventListener("keydown", (e) => {
        handleSheetTabKeydown(e, index, sheetNames.length);
      });
      
      tabsList.appendChild(tab);
    });
    
    // Create add new sheet button
    const addSheetButton = document.createElement("li");
    addSheetButton.className = "sheet-tab add-sheet";
    addSheetButton.innerHTML = "+";
    addSheetButton.title = "Add new sheet";
    addSheetButton.setAttribute("role", "button");
    addSheetButton.setAttribute("aria-label", "Add new sheet");
    addSheetButton.setAttribute("tabindex", "0");
    
    // Add event listener for add sheet button (placeholder for functionality)
    addSheetButton.addEventListener("click", () => {
      showToast("Sheet creation functionality coming soon!", "info");
    });
    
    // Add keyboard activation for add button
    addSheetButton.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        addSheetButton.click();
      }
    });
    
    tabsList.appendChild(addSheetButton);
    
    // Assemble and add to DOM
    selectorContainer.appendChild(tabsList);
    
    // Insert before data output
    dataView.prepend(selectorContainer);
  }
  
  // Handle sheet tab keyboard navigation
  function handleSheetTabKeydown(event, currentIndex, totalTabs) {
    const tabs = document.querySelectorAll(".sheet-tab:not(.add-sheet)");
    
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        // Move to next tab, or loop back to first
        const nextIndex = (currentIndex + 1) % totalTabs;
        const nextTab = tabs[nextIndex];
        if (nextTab) {
          nextTab.focus();
          switchToSheet(nextTab.dataset.sheet);
        }
        break;
        
      case "ArrowLeft":
        event.preventDefault();
        // Move to previous tab, or loop to last
        const prevIndex = (currentIndex - 1 + totalTabs) % totalTabs;
        const prevTab = tabs[prevIndex];
        if (prevTab) {
          prevTab.focus();
          switchToSheet(prevTab.dataset.sheet);
        }
        break;
        
      case "Home":
        event.preventDefault();
        // Move to first tab
        if (tabs[0]) {
          tabs[0].focus();
          switchToSheet(tabs[0].dataset.sheet);
        }
        break;
        
      case "End":
        event.preventDefault();
        // Move to last tab
        if (tabs[totalTabs - 1]) {
          tabs[totalTabs - 1].focus();
          switchToSheet(tabs[totalTabs - 1].dataset.sheet);
        }
        break;
        
      case "Enter":
      case " ":
        event.preventDefault();
        // Activate current tab
        switchToSheet(event.target.dataset.sheet);
        break;
    }
  }
  
  // Switch to a different sheet
  function switchToSheet(sheetName) {
    if (!sheetName || sheetName === currentSheetName) return;
    
    // Update active tab styling
    document.querySelectorAll(".sheet-tab").forEach(tab => {
      const isActive = tab.dataset.sheet === sheetName;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.setAttribute("tabindex", isActive ? "0" : "-1");
    });
    
    // Update current sheet and load data
    currentSheetName = sheetName;
    loadSheet(currentSheetName);
  }
  
  // Load a specific sheet
  function loadSheet(sheetName) {
    try {
      const worksheet = currentWorkbook.Sheets[sheetName];
      if (!worksheet) {
        throw new Error("Worksheet not found: " + sheetName);
      }
      
      data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      
      // Store original data (without sorting assumptions)
      originalData = JSON.parse(JSON.stringify(data));
      
      // Display the data
      displayData(data);
    } catch (error) {
      console.error("Error loading sheet:", error);
      showToast("Error loading sheet: " + error.message, "error");
    }
  }

  // Validate file type
  function isValidFileType(extension) {
    // Normalize extension by removing dot if present
    if (extension.startsWith('.')) {
      extension = extension.substring(1);
    }
    return ["xlsx", "xls", "csv", "txt"].includes(extension.toLowerCase());
  }




  // Scroll to the first visible element
  function scrollToVisible(element) {
    element.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });
  }

  // Scroll to the top of the output container
  function scrollToTop() {
    document.getElementById("output").scrollTo({ top: 0, behavior: "smooth" });
  }

  // Debounce function to limit the rate of function execution
  function debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Refresh the page
  function refreshPage() {
    location.reload();
  }

  // Handle title mouse down event
  function handleTitleMouseDown(event) {
    if (event.button === 0) refreshPage();
    else if (event.button === 1) openNewPage();
  }

  // Open a new page
  function openNewPage() {
    window.open("#", "_blank");
  }

  // Function to display data with improved styling and accessibility
  function displayData(parsedData) {
    if (!parsedData || !parsedData.length) {
      return;
    }

    const output = document.getElementById("output");
    output.innerHTML = "";
    data = parsedData;

    // Create table with proper accessibility attributes
    const table = document.createElement("table");
    table.setAttribute("id", "data-table");
    table.setAttribute("tabindex", "0");
    table.setAttribute("role", "table");
    table.setAttribute("aria-label", `Data table with ${parsedData.length} rows`);
    table.setAttribute("aria-rowcount", parsedData.length);
    
    // Calculate max columns from all rows to ensure all data is shown
    let maxColumns = 0;
    parsedData.forEach(row => {
      if (row.length > maxColumns) {
        maxColumns = row.length;
      }
    });
    table.setAttribute("aria-colcount", maxColumns);
    
    // Create table header if first row looks like headers
    const hasHeaders = parsedData.length > 1 && parsedData[0].some(cell => 
      typeof cell === 'string' && cell.trim() !== '' && 
      !parsedData[1].some(nextCell => typeof nextCell === 'string' && nextCell.includes(cell))
    );
    
    if (hasHeaders) {
      const thead = document.createElement("thead");
      const headerRow = document.createElement("tr");
      headerRow.setAttribute("role", "row");
      
      parsedData[0].forEach((cell, colIndex) => {
        const th = document.createElement("th");
        th.textContent = cell || `Column ${colIndex + 1}`;
        th.setAttribute("role", "columnheader");
        th.setAttribute("scope", "col");
        th.setAttribute("aria-sort", "none");
        th.id = `col-header-${colIndex}`;
        headerRow.appendChild(th);
      });
      
      thead.appendChild(headerRow);
      table.appendChild(thead);
      
      // Create body with remaining rows
      const tbody = document.createElement("tbody");
      parsedData.slice(1).forEach((row, rowIndex) => {
        const tr = createTableRow(row, rowIndex + 1, true);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
    } else {
      // Create table body with all rows
      const tbody = document.createElement("tbody");
      parsedData.forEach((row, rowIndex) => {
        const tr = createTableRow(row, rowIndex, false);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
    }
    
    output.appendChild(table);
    
    // Add keyboard navigation event handler
    table.addEventListener("keydown", handleTableKeydown);
    
    // Initialize keyboard navigation
    initKeyboardNavigation();
    
    // Announce table loading for screen readers
    const rowCount = parsedData.length;
    const columnCount = maxColumns;
    announceForScreenReaders(`Table loaded with ${rowCount} rows and ${columnCount} columns. Use arrow keys to navigate.`);
    
    // Update data status region
    const dataStatus = document.getElementById('data-status');
    if (dataStatus) {
      dataStatus.textContent = `Spreadsheet loaded: ${rowCount} rows, ${columnCount} columns`;
    }
  }

  // Create a table row with proper accessibility attributes
  function createTableRow(row, rowIndex, hasHeaders = false) {
    const tr = document.createElement("tr");
    tr.setAttribute("role", "row");
    tr.setAttribute("aria-rowindex", rowIndex + 1);
    
    row.forEach((cell, columnIndex) => {
      const td = createTableCell(cell, rowIndex, columnIndex, hasHeaders);
      tr.appendChild(td);
    });
    return tr;
  }

  // Create a table cell with proper accessibility attributes
  function createTableCell(cell, rowIndex, columnIndex, hasHeaders = false) {
    const td = document.createElement("td");
    td.textContent = cell || '';
    td.dataset.row = rowIndex;
    td.dataset.col = columnIndex;
    td.setAttribute("role", "gridcell");
    td.setAttribute("aria-colindex", columnIndex + 1);
    td.setAttribute("tabindex", "-1");
    
    // Add headers association if table has headers
    if (hasHeaders) {
      td.setAttribute("aria-describedby", `col-header-${columnIndex}`);
    }
    
    // Add accessible description for cell position
    const cellLabel = hasHeaders 
      ? `Row ${rowIndex + 1}, ${document.getElementById(`col-header-${columnIndex}`)?.textContent || `Column ${columnIndex + 1}`}` 
      : `Row ${rowIndex + 1}, Column ${columnIndex + 1}`;
    td.setAttribute("aria-label", `${cellLabel}: ${cell || 'empty cell'}`);
    
    if (cell !== "") td.classList.add("non-empty");
    
    // Add event listeners for cell interaction
    td.addEventListener("click", () => handleCellClick(td));
    
    // Always add double-click event listener for desktop, only skip on mobile
    if (!isMobileDevice()) {
      td.addEventListener("dblclick", (e) => {
        // Clear any pending single click timer
        if (clickTimer) {
          clearTimeout(clickTimer);
          clickTimer = null;
        }
        startEditing(td);
      });
    }
    
    // Add keyboard event listeners for accessibility
    td.addEventListener("keydown", (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (e.key === 'Enter') {
          startEditing(td);
        } else {
          handleCellClick(td);
        }
      }
    });
    
    return td;
  }

  // Handle cell click event
  function handleCellClick(cell) {
    // Skip if already in editing mode
    if (isEditing) return;
    
    // Clear any existing timer
    if (clickTimer) {
        clearTimeout(clickTimer);
    }
    
    // Set a new timer for single click
    clickTimer = setTimeout(() => {
        // Always copy content for any cell with content, not just "non-empty" ones
        if (cell.textContent && cell.textContent.trim() !== "") {
            copyToClipboard(cell.textContent);
            highlightCell(cell);
        }
    }, 250); // 250ms delay to wait for potential double click
  }

  // Copy text to clipboard
  function copyToClipboard(value) {
    // Try using the modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(value.trim())
        .then(() => {
          const truncatedValue = value.trim().length > 50 ? value.trim().substring(0, 50) + '...' : value.trim();
          showToast(`Copied: "${truncatedValue}"`, "success");
        })
        .catch((err) => {
          // If direct copying fails, try fallback method
          copyToClipboardFallback(value.trim());
        });
    } else {
      // Use fallback for browsers without clipboard API (including many mobile browsers)
      copyToClipboardFallback(value.trim());
    }
  }
  
  // Fallback method for copying text using a temporary element
  function copyToClipboardFallback(text) {
    try {
      // Create temporary textarea
      const textArea = document.createElement("textarea");
      textArea.value = text;
      // Make it invisible but part of the document
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      
      // Select and copy
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand("copy");
      // Safety check before removing
      if (textArea.parentNode === document.body) {
        document.body.removeChild(textArea);
      }
      
      if (successful) {
        const truncatedText = text.length > 50 ? text.substring(0, 50) + '...' : text;
        showToast(`Copied: "${truncatedText}"`, "success");
      } else {
        showToast("Copy failed. Try selecting and copying manually.", "warning");
      }
    } catch (err) {
      showToast("Failed to copy: " + err, "error");
    }
  }

  // Highlight the clicked cell
  function highlightCell(cell) {
    if (lastClickedCell) lastClickedCell.classList.remove("last-clicked");
    cell.classList.add("last-clicked");
    lastClickedCell = cell;
    
    // Also set keyboard focus
    focusCell(cell);
  }

  // Enhanced toast notification with comprehensive feedback
  function showToast(message, type = "success", duration = 3000) {
    const toastContainer = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.setAttribute("role", "alert");
    toast.setAttribute("aria-live", "assertive");
    toast.setAttribute("aria-atomic", "true");
    
    // Add an icon based on the type with better symbols
    const icon = document.createElement("span");
    icon.className = "toast-icon";
    icon.setAttribute("aria-hidden", "true");
    
    // Professional icons and colors
    if (type === "success") {
      icon.innerHTML = "✓";
      toast.setAttribute("aria-label", `Success: ${message}`);
    } else if (type === "warning") {
      icon.innerHTML = "⚠";
      toast.setAttribute("aria-label", `Warning: ${message}`);
    } else if (type === "info") {
      icon.innerHTML = "ℹ";
      toast.setAttribute("aria-label", `Information: ${message}`);
    } else {
      icon.innerHTML = "✕";
      toast.setAttribute("aria-label", `Error: ${message}`);
    }
    
    // Create a text container for the message
    const textSpan = document.createElement("span");
    textSpan.className = "toast-text";
    textSpan.textContent = message;
    
    // Add close button for accessibility
    const closeButton = document.createElement("button");
    closeButton.className = "toast-close";
    closeButton.setAttribute("aria-label", "Close notification");
    closeButton.innerHTML = "×";
    closeButton.addEventListener("click", () => dismissToast(toast));
    
    // Build toast structure
    toast.appendChild(icon);
    toast.appendChild(textSpan);
    toast.appendChild(closeButton);
    
    // Add progress bar
    const progressBar = document.createElement("div");
    progressBar.className = "toast-progress";
    toast.appendChild(progressBar);
    
    toastContainer.appendChild(toast);
    
    // Adjust width based on content after rendering
    requestAnimationFrame(() => {
      // Set width based on content but with min/max constraints
      const contentWidth = textSpan.scrollWidth;
      const minWidth = 240; // Minimum width in pixels
      const maxWidth = Math.min(420, window.innerWidth * 0.9); // Maximum width in pixels
      
      if (contentWidth < minWidth) {
        toast.style.width = `${minWidth}px`;
      } else if (contentWidth > maxWidth) {
        toast.style.width = `${maxWidth}px`;
      } else {
        toast.style.width = `${contentWidth + 80}px`; // Adding padding and icon width
      }
    });
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add("show");
      progressBar.style.width = "0%";
    }, 10);
    
    // Enhanced auto-dismiss with configurable duration
    setTimeout(() => dismissToast(toast), duration);
    
    // Also announce to screen readers
    announceForScreenReaders(message, type === 'error' ? 'assertive' : 'polite');
  }
  
  // Helper function to dismiss toast notifications
  function dismissToast(toast) {
    if (!toast || !toast.parentNode) return;
    
    toast.classList.remove("show");
    toast.addEventListener("transitionend", () => {
      // Safety check: only remove if toast is still a child of the container
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }
  
  // Enhanced error handling with detailed user feedback
  function handleError(error, context = 'Unknown', userMessage = null) {
    console.error(`Error in ${context}:`, error);
    
    // Determine user-friendly message
    let displayMessage = userMessage;
    if (!displayMessage) {
      if (error.name === 'TypeError') {
        displayMessage = 'A technical error occurred. Please try again.';
      } else if (error.name === 'NetworkError') {
        displayMessage = 'Network connection issue. Please check your internet connection.';
      } else if (error.message.includes('file')) {
        displayMessage = 'File processing error. Please check the file format and try again.';
      } else {
        displayMessage = error.message || 'An unexpected error occurred. Please try again.';
      }
    }
    
    // Show error toast with longer duration
    showToast(displayMessage, 'error', 5000);
    
    // Log to analytics or error reporting service if available
    if (window.analytics) {
      window.analytics.track('error', {
        context,
        error: error.message,
        stack: error.stack
      });
    }
  }
  
  // Success feedback with contextual messages
  function showSuccessMessage(action, details = null) {
    let message = '';
    switch (action) {
      case 'file_loaded':
        message = details ? `File loaded successfully! ${details.rows} rows, ${details.columns} columns` : 'File loaded successfully!';
        break;
      case 'file_exported':
        message = details ? `Data exported as ${details.format.toUpperCase()} successfully!` : 'Data exported successfully!';
        break;
      case 'data_copied':
        message = details ? `"${details.substring(0, 30)}..." copied to clipboard` : 'Data copied to clipboard';
        break;
      case 'data_refreshed':
        message = 'Data refreshed from source file';
        break;
      default:
        message = 'Operation completed successfully!';
    }
    
    showToast(message, 'success', 2500);
  }
  
  // Warning messages for user guidance
  function showWarningMessage(warning, guidance = null) {
    const message = guidance ? `${warning} ${guidance}` : warning;
    showToast(message, 'warning', 4000);
  }
  
  // Information messages for user guidance
  function showInfoMessage(info) {
    showToast(info, 'info', 3000);
  }

  

  // Move keyboard focus to a specified cell
  function moveFocusToCell(row, col) {
    // Clear existing focus
    clearCellFocus();
    
    // Find the target cell
    const cell = document.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
    if (!cell) return;
    
    // Add focus to new cell
    cell.classList.add("keyboard-focus");
    currentFocusedCell = cell;
    
    // Set tabindex to make it focusable
    cell.setAttribute('tabindex', '0');
    
    // Focus the cell
    cell.focus();
    
    // Scroll the cell into view
    scrollToVisible(cell);
  }
  
  // Clear cell focus
  function clearCellFocus() {
    if (currentFocusedCell) {
      currentFocusedCell.classList.remove("keyboard-focus");
      currentFocusedCell.removeAttribute('tabindex');
      currentFocusedCell = null;
    }
  }

  // Focus the first cell in the table
  function focusFirstCell() {
    const firstCell = document.querySelector('td[data-row="0"][data-col="0"]');
    if (firstCell) {
      moveFocusToCell(0, 0);
    }
  }

  // Initialize keyboard navigation
  function initKeyboardNavigation() {
    const table = document.querySelector('table');
    if (!table) return;
    
    // Focus first cell when table receives focus
    table.addEventListener('focus', () => {
      if (!currentFocusedCell) {
        focusFirstCell();
      }
    });
    
    // Restore focus after cell editing
    document.addEventListener('keydown', function(e) {
      // Skip if inside an input field
      if (e.target.tagName === 'INPUT') return;
      
      // Skip all keyboard shortcuts on mobile devices
      if (isMobileDevice()) return;
      
      // Show keyboard shortcuts legend when "?" is pressed
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        showKeyboardShortcutsLegend();
        return;
      }
      
      // Add Alt+K shortcut to show keyboard shortcuts
      if (e.key === "k" && e.altKey) {
        e.preventDefault();
        showKeyboardShortcutsLegend();
        return;
      }
      
      // Add Ctrl+T shortcut for theme toggle
      if (e.key === "t" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        toggleTheme();
        return;
      }
      
      // Add Ctrl+I shortcut for import
      if (e.key === "i" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        fileInput.click();
        return;
      }
      
      // Add Ctrl+R shortcut for refresh (only if data is loaded)
      if (e.key === "r" && (e.ctrlKey || e.metaKey) && data && data.length > 0) {
        e.preventDefault();
        handleRefresh();
        return;
      }
      
      // Skip if currently editing a cell
      if (isEditing) return;
      
      // Only handle navigation if data is loaded and a table exists
      if (!data || data.length === 0) return;
      
      // Get table dimensions
      const rowCount = data.length;
      const columnCount = data[0].length;
      
      // If not currently focused on a cell, focus the first cell
      if (!currentFocusedCell) {
        if (e.key.startsWith('Arrow')) {
          focusFirstCell();
          e.preventDefault();
          return;
        }
        return;
      }
      
      // Get current position
      const currentRow = parseInt(currentFocusedCell.dataset.row);
      const currentCol = parseInt(currentFocusedCell.dataset.col);
      
      // Handle arrow key navigation
      switch (e.key) {
        case "ArrowUp":
          e.preventDefault();
          navigateToCell(currentRow - 1, currentCol);
          break;
        case "ArrowDown":
          e.preventDefault();
          navigateToCell(currentRow + 1, currentCol);
          break;
        case "ArrowLeft":
          e.preventDefault();
          navigateToCell(currentRow, currentCol - 1);
          break;
        case "ArrowRight":
          e.preventDefault();
          navigateToCell(currentRow, currentCol + 1);
          break;
        case "Home":
          e.preventDefault();
          // Navigate to first cell in the row
          navigateToCell(currentRow, 0);
          break;
        case "End":
          e.preventDefault();
          // Navigate to last cell in the row
          navigateToCell(currentRow, columnCount - 1);
          break;
        case "PageUp":
          e.preventDefault();
          // Navigate to first cell in the column
          navigateToCell(0, currentCol);
          break;
        case "PageDown":
          e.preventDefault();
          // Navigate to last cell in the column
          navigateToCell(rowCount - 1, currentCol);
          break;
        case "c":
          // Copy current cell when Ctrl+C is pressed
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            copyToClipboard(currentFocusedCell.textContent);
          }
          break;
        case "Enter":
          // Start editing the current cell when Enter is pressed
          e.preventDefault();
          startEditing(currentFocusedCell);
          break;
        case "Escape":
          // Clear cell focus when Escape is pressed
          e.preventDefault();
          clearCellFocus();
          break;
      }
    });
  }
  
  // Navigate to a specific cell by row and column index
  function navigateToCell(row, col) {
    // Ensure row and column are within bounds
    if (!data || data.length === 0) return;
    
    row = Math.max(0, Math.min(row, data.length - 1));
    col = Math.max(0, Math.min(col, data[0].length - 1));
    
    // Move focus to the cell
    moveFocusToCell(row, col);
  }
  
  // Start editing a cell
  function startEditing(cell) {
    // Skip if already editing (but not on mobile device check)
    if (isEditing) return;
    
    isEditing = true;
    editingCell = cell;
    
    // Store original value
    const originalValue = cell.textContent;
    
    // Add editing class to the cell
    cell.classList.add("editing");
    
    // Create input element
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalValue;
    input.className = "cell-edit-input";
    
    // Clear the cell and add the input
    cell.textContent = "";
    cell.appendChild(input);
    
    // Focus the input
    input.focus();
    input.select();
    
    // Add a document click handler to detect clicks outside the cell being edited
    const handleClickOutside = (e) => {
      // If the click is outside the cell being edited, finish editing
      if (editingCell && !editingCell.contains(e.target)) {
        finishEditing(true);
        document.removeEventListener("click", handleClickOutside);
      }
    };
    
    // Add the click handler with a slight delay to avoid immediate triggering
    setTimeout(() => {
      document.addEventListener("click", handleClickOutside);
    }, 0);
    
    // Handle input events
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        // Save changes
        finishEditing(true);
        document.removeEventListener("click", handleClickOutside);
        e.preventDefault();
      } else if (e.key === "Escape") {
        // Cancel changes
        finishEditing(false);
        document.removeEventListener("click", handleClickOutside);
        e.preventDefault();
      } else if (e.key === "Tab") {
        // Save and move to next cell
        finishEditing(true);
        document.removeEventListener("click", handleClickOutside);
        
        const currentRow = parseInt(cell.dataset.row);
        const currentCol = parseInt(cell.dataset.col);
        
        let nextCell;
        if (e.shiftKey) {
          // Move backwards
          nextCell = document.querySelector(`td[data-row="${currentRow}"][data-col="${currentCol - 1}"]`);
        } else {
          // Move forwards
          nextCell = document.querySelector(`td[data-row="${currentRow}"][data-col="${currentCol + 1}"]`);
        }
        
        if (nextCell) {
          // Move to the next cell and start editing it
          setTimeout(() => {
            moveFocusToCell(parseInt(nextCell.dataset.row), parseInt(nextCell.dataset.col));
            startEditing(nextCell);
          }, 10);
        }
        
        e.preventDefault();
      }
    });
  }

  // Finish editing a cell
  function finishEditing(save) {
    if (!editingCell) return;
    
    if (save) {
      // Save changes
      const currentRow = parseInt(editingCell.dataset.row);
      const currentCol = parseInt(editingCell.dataset.col);
      const newValue = editingCell.querySelector('.cell-edit-input').value.trim();
      
      // Update data
      data[currentRow][currentCol] = newValue;
      
      // Update UI
      editingCell.textContent = newValue;
    } else {
      // If not saving changes, restore the original content
      const originalValue = data[parseInt(editingCell.dataset.row)][parseInt(editingCell.dataset.col)];
      editingCell.textContent = originalValue;
    }
    
    // Remove editing class
    editingCell.classList.remove("editing");
    
    // Set non-empty class if needed
    if (editingCell.textContent !== "") {
      editingCell.classList.add("non-empty");
    } else {
      editingCell.classList.remove("non-empty");
    }
    
    // Clear editing mode
    isEditing = false;
    editingCell = null;
  }

  // Create keyboard shortcuts legend with improved accessibility
  function showKeyboardShortcutsLegend() {
    // Don't show keyboard shortcuts on mobile devices
    if (isMobileDevice()) return;
    
    // Remove any existing legend first
    const existingLegend = document.querySelector(".keyboard-shortcuts-legend");
    if (existingLegend) {
      existingLegend.remove();
    }
    
    // Create the legend container
    const legend = document.createElement("div");
    legend.className = "keyboard-shortcuts-legend";
    legend.setAttribute("role", "dialog");
    legend.setAttribute("aria-modal", "true");
    legend.setAttribute("aria-labelledby", "keyboard-shortcuts-title");
    
    // Create the title
    const title = document.createElement("h3");
    title.id = "keyboard-shortcuts-title";
    title.textContent = "Keyboard Shortcuts";
    
    // Create the close button
    const closeButton = document.createElement("button");
    closeButton.className = "legend-close-button";
    closeButton.innerHTML = "×";
    closeButton.setAttribute("aria-label", "Close keyboard shortcuts");
    closeButton.addEventListener("click", () => {
      legend.classList.remove("visible");
      setTimeout(() => {
        legend.remove();
        keyboardShortcutsButton.focus(); // Return focus to the button that opened it
      }, 300);
    });
    
    // Create the list of shortcuts
    const shortcutsList = document.createElement("ul");
    
    // Add all the shortcuts
    const shortcuts = [
      { key: "Arrow keys", description: "Navigate between cells" },
      { key: "Enter", description: "Edit cell / Save changes" },
      { key: "Tab / Shift+Tab", description: "Move to next/previous cell" },
      { key: "Escape", description: "Cancel editing / Close dialogs" },
      { key: "Ctrl+C", description: "Copy selected cell content" },
      { key: "Ctrl+I", description: "Import file" },
      { key: "Ctrl+R", description: "Refresh data" },
      { key: "Ctrl+E", description: "Export menu" },
      { key: "Ctrl+T", description: "Toggle theme" },
      { key: "Alt+K", description: "Show keyboard shortcuts" }
    ];
    
    shortcuts.forEach(shortcut => {
      const item = document.createElement("li");
      
      const description = document.createElement("span");
      description.textContent = shortcut.description;
      
      const keySpan = document.createElement("span");
      keySpan.className = "shortcut-key";
      keySpan.textContent = shortcut.key;
      
      item.appendChild(description);
      item.appendChild(keySpan);
      shortcutsList.appendChild(item);
    });
    
    // Assemble the legend
    legend.appendChild(title);
    legend.appendChild(closeButton);
    legend.appendChild(shortcutsList);
    
    // Add the legend to the document
    document.body.appendChild(legend);
    
    // Add visible class to make the legend appear
    setTimeout(() => {
      legend.classList.add("visible");
    }, 10);
    
    // Set focus to the dialog for keyboard navigation
    closeButton.focus();
    
    // Close when ESC is pressed
    document.addEventListener("keydown", function closeOnEsc(e) {
      if (e.key === "Escape") {
        legend.classList.remove("visible");
        setTimeout(() => {
          legend.remove();
          keyboardShortcutsButton.focus();
        }, 300);
        document.removeEventListener("keydown", closeOnEsc);
      }
    });
    
    // Close when clicking outside
    document.addEventListener("click", function closeOnClickOutside(e) {
      if (document.contains(legend) && !legend.contains(e.target) && e.target !== keyboardShortcutsButton) {
        legend.classList.remove("visible");
        setTimeout(() => {
          legend.remove();
          keyboardShortcutsButton.focus();
        }, 300);
        document.removeEventListener("click", closeOnClickOutside);
      }
    });
  }

  // Function to announce messages to screen readers
  function announceForScreenReaders(message, priority = 'polite') {
    const liveRegionId = priority === 'assertive' ? 'aria-live-assertive' : 'aria-live-polite';
    const announcer = document.getElementById(liveRegionId);
    
    if (announcer) {
      // Clear previous content first
      announcer.textContent = '';
      
      // Use setTimeout to ensure the clearing happens before the new content
      setTimeout(() => {
        announcer.textContent = message;
        
        // Clear after announcement to allow for repeated announcements
        setTimeout(() => {
          announcer.textContent = '';
        }, 1000);
      }, 100);
    } else {
      // Fallback for when live regions aren't available
      console.log(`Screen reader announcement: ${message}`);
    }
  }
  
  // Announce search results
  function announceSearchResults(matchCount, searchText) {
    if (matchCount > 0) {
      announceForScreenReaders(`Found ${matchCount} match${matchCount !== 1 ? 'es' : ''} for "${searchText}"`);
    } else {
      announceForScreenReaders(`No matches found for "${searchText}"`);
    }
  }
  
  // Highlight text within a cell
  function highlightTextInCell(cell, searchText) {
    if (!cell.dataset.originalText) {
      // Store original text content
      cell.dataset.originalText = cell.textContent;
    }
    
    const originalText = cell.dataset.originalText;
    const regex = new RegExp(`(${escapeRegExp(searchText)})`, 'gi');
    const highlightedHTML = originalText.replace(regex, '<mark class="search-match">$1</mark>');
    
    cell.innerHTML = highlightedHTML;
  }
  
  // Restore original cell text
  function restoreOriginalCellText(cell) {
    if (cell.dataset.originalText) {
      cell.textContent = cell.dataset.originalText;
      delete cell.dataset.originalText;
    }
  }
  
  // Escape special regex characters
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // Parse Excel files
  function parseExcel(fileData) {
    try {
      // Parse Excel binary data
      const workbook = XLSX.read(new Uint8Array(fileData), { type: "array" });
      
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("Invalid Excel file or no data found");
      }
      
      // Store the workbook for future reference
      currentWorkbook = workbook;
      
      // Create sheet selector if multiple sheets exist
      if (workbook.SheetNames.length > 1) {
        createSheetSelector(workbook.SheetNames);
      } else {
        // Remove sheet selector if it exists
        const existingSelector = document.getElementById("sheetSelector");
        if (existingSelector) {
          existingSelector.remove();
        }
      }
      
      // Display the first sheet by default
      currentSheetName = workbook.SheetNames[0];
      
      // Load the first sheet and return its data
      return loadSheetData(currentSheetName);
    } catch (error) {
      console.error("Excel parsing error:", error);
      throw new Error("Failed to parse Excel file: " + error.message);
    }
  }

  // Parse CSV files
  function parseCSV(fileData) {
    try {
      // Parse CSV using SheetJS
      const workbook = XLSX.read(fileData, { type: "string" });
      
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("Invalid CSV file or no data found");
      }
      
      // Store the workbook
      currentWorkbook = workbook;
      currentSheetName = workbook.SheetNames[0];
      
      // Create sheet selector if multiple sheets exist
      if (workbook.SheetNames.length > 1) {
        createSheetSelector(workbook.SheetNames);
      } else {
        // Remove sheet selector if it exists
        const existingSelector = document.getElementById("sheetSelector");
        if (existingSelector) {
          existingSelector.remove();
        }
      }
      
      // Return the parsed data
      return loadSheetData(currentSheetName);
    } catch (error) {
      console.error("CSV parsing error:", error);
      throw new Error("Failed to parse CSV file: " + error.message);
    }
  }

  // Parse Text files
  function parseTXT(fileData) {
    try {
      const workbook = XLSX.read(fileData, { type: "string" });
      
      if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
        throw new Error("Invalid text file or no data found");
      }
      
      // Store the workbook
      currentWorkbook = workbook;
      currentSheetName = workbook.SheetNames[0];
      
      // Create sheet selector if multiple sheets exist
      if (workbook.SheetNames.length > 1) {
        createSheetSelector(workbook.SheetNames);
      } else {
        // Remove sheet selector if it exists
        const existingSelector = document.getElementById("sheetSelector");
        if (existingSelector) {
          existingSelector.remove();
        }
      }
      
      // Return the parsed data
      return loadSheetData(currentSheetName);
    } catch (error) {
      console.error("TXT parsing error:", error);
      throw new Error("Failed to parse text file: " + error.message);
    }
  }

  // Load sheet data from the current workbook
  function loadSheetData(sheetName) {
    try {
      if (!currentWorkbook || !currentWorkbook.Sheets[sheetName]) {
        throw new Error("Sheet not found");
      }
      
      // Convert sheet to array of arrays
      const sheetData = XLSX.utils.sheet_to_json(currentWorkbook.Sheets[sheetName], {
        header: 1,
        defval: ""
      });
      
      if (!sheetData || sheetData.length === 0) {
        throw new Error("No data found in sheet");
      }
      
      return sheetData;
    } catch (error) {
      console.error("Error loading sheet data:", error);
      throw new Error("Failed to load sheet data: " + error.message);
    }
  }

  // Focus on a cell (used in highlightCell function)
  function focusCell(cell) {
    // Clear any existing focus
    clearCellFocus();
    
    // Set new focus
    currentFocusedCell = cell;
    cell.classList.add("keyboard-focus");
    cell.setAttribute('tabindex', '0');
    cell.focus();
  }

  // Handle table keydown events for keyboard navigation
  function handleTableKeydown(e) {
    // Skip if editing a cell
    if (isEditing) return;
    
    const target = e.target;
    
    // If the table itself has focus, focus the first cell instead
    if (target.tagName === 'TABLE') {
      focusFirstCell();
      e.preventDefault();
      return;
    }
    
    // Get current position
    const currentRow = parseInt(target.dataset.row || "0");
    const currentCol = parseInt(target.dataset.col || "0");
    
    // Handle key navigation
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        navigateToCell(currentRow - 1, currentCol);
        break;
      case "ArrowDown":
        e.preventDefault();
        navigateToCell(currentRow + 1, currentCol);
        break;
      case "ArrowLeft":
        e.preventDefault();
        navigateToCell(currentRow, currentCol - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        navigateToCell(currentRow, currentCol + 1);
        break;
      case "Enter":
        e.preventDefault();
        // Start editing cell
        if (target.tagName === 'TD') {
          startEditing(target);
        }
        break;
      case "Escape":
        e.preventDefault();
        clearCellFocus();
        break;
    }
  }

  // Add global keyboard shortcut listener for Alt+K and F1
  document.addEventListener('keydown', function(e) {
    if (e.key === "k" && e.altKey && !isMobileDevice()) {
      e.preventDefault();
      showKeyboardShortcutsLegend();
      return;
    }
    // Also support Shift+? for help
    if (e.key === "?" && e.shiftKey && !isMobileDevice()) {
      e.preventDefault();
      showKeyboardShortcutsLegend();
      return;
    }
    // F1 for help system
    if (e.key === "F1") {
      e.preventDefault();
      showHelpSystem();
      return;
    }
  });
  
  // Help System Implementation
  function showHelpSystem() {
    const helpOverlay = document.getElementById('helpOverlay');
    if (!helpOverlay) return;
    
    helpOverlay.style.display = 'flex';
    setTimeout(() => helpOverlay.classList.add('visible'), 10);
    
    // Focus management
    const closeButton = document.getElementById('closeHelp');
    if (closeButton) closeButton.focus();
    
    // Trap focus within help dialog
    trapFocus(helpOverlay);
    
    // Announce for screen readers
    announceForScreenReaders('Help dialog opened', 'assertive');
  }
  
  function hideHelpSystem() {
    const helpOverlay = document.getElementById('helpOverlay');
    if (!helpOverlay) return;
    
    helpOverlay.classList.remove('visible');
    setTimeout(() => {
      helpOverlay.style.display = 'none';
    }, 300);
    
    // Return focus to trigger element or first focusable element
    const keyboardShortcutsButton = document.getElementById('showKeyboardShortcuts');
    if (keyboardShortcutsButton) {
      keyboardShortcutsButton.focus();
    }
    
    announceForScreenReaders('Help dialog closed');
  }
  
  // Focus trap utility
  function trapFocus(element) {
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', function(e) {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstFocusable) {
            lastFocusable.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastFocusable) {
            firstFocusable.focus();
            e.preventDefault();
          }
        }
      }
      
      if (e.key === 'Escape') {
        hideHelpSystem();
        e.preventDefault();
      }
    });
  }
  
  // Tour System Implementation
  const tourSteps = [
    {
      target: '#importButton',
      title: 'Import Your Data',
      description: 'Click here to import Excel, CSV, or text files. You can also drag and drop files directly onto the page.',
      position: 'bottom'
    },
    {
      target: '#searchContainer',
      title: 'Search Your Data',
      description: 'Use the search bar to quickly find specific information in your spreadsheet. Results will be highlighted.',
      position: 'bottom'
    },
    {
      target: '#exportButton',
      title: 'Export Your Data',
      description: 'Export your data in various formats including Excel, CSV, HTML, and plain text.',
      position: 'bottom'
    },
    {
      target: '#themeToggle',
      title: 'Toggle Theme',
      description: 'Switch between light and dark themes for comfortable viewing in any environment.',
      position: 'bottom'
    },
    {
      target: '#toolsButton',
      title: 'Additional Tools',
      description: 'Access additional features like data refresh and keyboard shortcuts from the tools menu.',
      position: 'bottom'
    }
  ];
  
  let currentTourStep = 0;
  let tourActive = false;
  
  function startTour() {
    if (tourActive) return;
    
    tourActive = true;
    currentTourStep = 0;
    
    // Create tour overlay
    const overlay = document.createElement('div');
    overlay.className = 'tour-overlay';
    overlay.id = 'tourOverlay';
    document.body.appendChild(overlay);
    
    // Hide help system
    hideHelpSystem();
    
    // Show first step
    showTourStep(currentTourStep);
    
    announceForScreenReaders('Interactive tour started', 'assertive');
  }
  
  function showTourStep(stepIndex) {
    if (stepIndex < 0 || stepIndex >= tourSteps.length) {
      endTour();
      return;
    }
    
    const step = tourSteps[stepIndex];
    const target = document.querySelector(step.target);
    const tooltip = document.getElementById('tourTooltip');
    
    if (!target || !tooltip) {
      endTour();
      return;
    }
    
    // Update tooltip content
    tooltip.querySelector('.tour-step').textContent = `${stepIndex + 1} of ${tourSteps.length}`;
    tooltip.querySelector('.tour-title').textContent = step.title;
    tooltip.querySelector('.tour-description').textContent = step.description;
    
    // Position tooltip
    positionTourTooltip(tooltip, target, step.position);
    
    // Show tooltip
    tooltip.style.display = 'block';
    setTimeout(() => tooltip.classList.add('visible'), 10);
    
    // Highlight target
    highlightElement(target);
    
    // Update navigation buttons
    const prevButton = document.getElementById('tourPrev');
    const nextButton = document.getElementById('tourNext');
    
    if (prevButton) {
      prevButton.disabled = stepIndex === 0;
      prevButton.style.opacity = stepIndex === 0 ? '0.5' : '1';
    }
    
    if (nextButton) {
      nextButton.textContent = stepIndex === tourSteps.length - 1 ? 'Finish' : 'Next';
    }
    
    // Announce step for screen readers
    announceForScreenReaders(`Tour step ${stepIndex + 1}: ${step.title}. ${step.description}`);
  }
  
  function positionTourTooltip(tooltip, target, position) {
    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    
    // Remove existing position classes
    tooltip.classList.remove('top', 'bottom', 'left', 'right');
    tooltip.classList.add(position);
    
    let top, left;
    
    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - 12;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + 12;
        left = targetRect.left + (targetRect.width / 2) - (tooltipRect.width / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.left - tooltipRect.width - 12;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipRect.height / 2);
        left = targetRect.right + 12;
        break;
    }
    
    // Keep tooltip on screen
    const margin = 16;
    top = Math.max(margin, Math.min(window.innerHeight - tooltipRect.height - margin, top));
    left = Math.max(margin, Math.min(window.innerWidth - tooltipRect.width - margin, left));
    
    tooltip.style.top = `${top + window.scrollY}px`;
    tooltip.style.left = `${left + window.scrollX}px`;
  }
  
  function highlightElement(element) {
    // Remove existing highlights
    const existingHighlight = document.querySelector('.tour-highlight');
    if (existingHighlight) existingHighlight.remove();
    
    // Create new highlight
    const highlight = document.createElement('div');
    highlight.className = 'tour-highlight';
    
    const rect = element.getBoundingClientRect();
    highlight.style.top = `${rect.top + window.scrollY - 4}px`;
    highlight.style.left = `${rect.left + window.scrollX - 4}px`;
    highlight.style.width = `${rect.width + 8}px`;
    highlight.style.height = `${rect.height + 8}px`;
    
    document.body.appendChild(highlight);
    
    // Scroll element into view
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  
  function nextTourStep() {
    if (currentTourStep < tourSteps.length - 1) {
      currentTourStep++;
      showTourStep(currentTourStep);
    } else {
      endTour();
    }
  }
  
  function prevTourStep() {
    if (currentTourStep > 0) {
      currentTourStep--;
      showTourStep(currentTourStep);
    }
  }
  
  function endTour() {
    tourActive = false;
    
    // Hide tooltip
    const tooltip = document.getElementById('tourTooltip');
    if (tooltip) {
      tooltip.classList.remove('visible');
      setTimeout(() => tooltip.style.display = 'none', 300);
    }
    
    // Remove overlay and highlights
    const overlay = document.getElementById('tourOverlay');
    if (overlay) overlay.remove();
    
    const highlight = document.querySelector('.tour-highlight');
    if (highlight) highlight.remove();
    
    // Show completion message
    showToast('Tour completed! You can always press F1 to access help.', 'info', 4000);
    announceForScreenReaders('Tour completed');
  }
  
  // Event listeners for help and tour systems
  document.addEventListener('DOMContentLoaded', function() {
    // Help system event listeners
    const closeHelpButtons = [document.getElementById('closeHelp'), document.getElementById('closeHelpBottom')];
    closeHelpButtons.forEach(button => {
      if (button) {
        button.addEventListener('click', hideHelpSystem);
      }
    });
    
    // Tour system event listeners
    const startTourButton = document.getElementById('startTour');
    if (startTourButton) {
      startTourButton.addEventListener('click', startTour);
    }
    
    const tourNext = document.getElementById('tourNext');
    if (tourNext) {
      tourNext.addEventListener('click', nextTourStep);
    }
    
    const tourPrev = document.getElementById('tourPrev');
    if (tourPrev) {
      tourPrev.addEventListener('click', prevTourStep);
    }
    
    const tourClose = document.querySelector('.tour-close');
    if (tourClose) {
      tourClose.addEventListener('click', endTour);
    }
    
    // Close help on overlay click
    const helpOverlay = document.getElementById('helpOverlay');
    if (helpOverlay) {
      helpOverlay.addEventListener('click', function(e) {
        if (e.target === helpOverlay) {
          hideHelpSystem();
        }
      });
    }
  });
  
  // Check if this is the user's first visit and show help hint
  function checkFirstVisit() {
    const hasVisited = localStorage.getItem('breadsheet_visited');
    if (!hasVisited) {
      localStorage.setItem('breadsheet_visited', 'true');
      
      // Show welcome message after a delay
      setTimeout(() => {
        showInfoMessage('Welcome to Bread Sheet! Press F1 for help or click any Import button to get started.');
      }, 2000);
    }
  }
  
  // Announce application ready for screen readers
  setTimeout(() => {
    announceForScreenReaders("Bread Sheet application ready. Press Alt+K for keyboard shortcuts or F1 for help.");
    checkFirstVisit();
  }, 1000);
}