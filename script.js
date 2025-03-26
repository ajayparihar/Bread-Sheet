// Bread Sheet - Main JavaScript
// Developer: Ajay Singh
// Version: 1.2
// Date: 04-06-2024
// Description: This script handles file reading (Excel/CSV), displays data in a table,
//              provides search functionality, and supports the enhanced glassomorphic UI design.

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
  const searchContainer = document.querySelector(".search-bar");
  const searchInput = document.getElementById("searchInput");
  const searchOptionsToggle = document.getElementById("searchOptionsToggle");
  const searchOptionsPanel = document.getElementById("searchOptionsPanel");
  const columnSelector = document.getElementById("columnSelector");
  const caseSensitiveCheckbox = document.getElementById("caseSensitive");
  const regexSearchCheckbox = document.getElementById("regexSearch");
  const wholeWordCheckbox = document.getElementById("wholeWord");
  const container = document.querySelector(".container");
  const dragDropInstructions = document.querySelector(
    ".drag-drop-instructions"
  );
  const themeToggle = document.getElementById("themeToggle");
  const exportButton = document.getElementById("exportButton");
  const exportDropdown = exportButton.closest(".dropdown");
  const exportOptions = document.querySelectorAll(".dropdown-item");
  const refreshButton = document.getElementById("refreshButton");
  const keyboardShortcutsButton = document.getElementById("showKeyboardShortcuts");
  const mobileAddButton = document.querySelector(".mobile-add-button");
  const actionButtons = document.getElementById("actionButtons");

  // Constants for local storage keys
  const STORAGE_KEYS = {
    THEME: "breadSheetTheme",
    CONTAINER_WIDTH: "breadSheetContainerWidth",
    CONTAINER_HEIGHT: "breadSheetContainerHeight",
    SEARCH_OPTIONS: "breadSheetSearchOptions"
  };

  // Hide action buttons by default (no data loaded initially)
  if (actionButtons) {
    actionButtons.style.display = 'none';
  }

  // Hide keyboard shortcuts button on mobile
  if (isMobileDevice() && keyboardShortcutsButton) {
    keyboardShortcutsButton.style.display = 'none';
  } else if (keyboardShortcutsButton) {
    // Also hide on desktop initially since no data is loaded
    keyboardShortcutsButton.style.display = 'none';
  }

  // Show a random image in the output area when no file is loaded
  displayRandomImage();

  let resizeHandle,
    data = [],
    lastClickedCell = null,
    isResizing = false,
    currentWorkbook = null,
    currentSheetName = "",
    isDarkTheme = true,
    currentFileName = "",
    currentFile = null,
    originalData = [], 
    isRefreshing = false,
    searchOptions = {  // Default search options
      selectedColumn: "all",
      caseSensitive: false,
      useRegex: false,
      wholeWord: false
    },
    currentFocusedCell = null,
    isEditing = false,    // Flag to track if a cell is being edited
    editingCell = null;   // Reference to the cell being edited

  // Initialize settings from localStorage
  initializeSettings();
  
  // Add animation for mobile button
  animateMobileButton();

  // Event Listeners
  fileInput.addEventListener("change", handleFileUpload);
  searchInput.addEventListener("input", debounce(handleSearch, 300));
  searchOptionsToggle.addEventListener("click", toggleSearchOptions);
  columnSelector.addEventListener("change", updateSearchOptions);
  caseSensitiveCheckbox.addEventListener("change", updateSearchOptions);
  regexSearchCheckbox.addEventListener("change", updateSearchOptions);
  wholeWordCheckbox.addEventListener("change", updateSearchOptions);
  
  document
    .getElementById("projectTitle")
    .addEventListener("click", refreshPage);
  document
    .getElementById("projectTitle")
    .addEventListener("mousedown", handleTitleMouseDown);
  themeToggle.addEventListener("click", toggleTheme);
  refreshButton.addEventListener("click", handleRefresh);
  
  // Only set up keyboard shortcuts button listener on non-mobile devices
  if (!isMobileDevice() && keyboardShortcutsButton) {
    keyboardShortcutsButton.addEventListener("click", showKeyboardShortcutsLegend);
  }
  
  // Close search options panel when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchContainer.contains(e.target) && searchOptionsPanel.classList.contains("visible")) {
      searchOptionsPanel.classList.remove("visible");
      searchOptionsToggle.setAttribute("aria-expanded", "false");
      searchOptionsToggle.style.transform = "rotate(0)";
    }
  });
  
  // Export functionality
  exportButton.addEventListener("click", () => {
    exportDropdown.classList.toggle("active");
    const isExpanded = exportDropdown.classList.contains("active");
    exportButton.setAttribute("aria-expanded", isExpanded);
  });
  
  // Close dropdown when clicking outside
  document.addEventListener("click", (e) => {
    if (!exportDropdown.contains(e.target)) {
      exportDropdown.classList.remove("active");
      exportButton.setAttribute("aria-expanded", "false");
    }
  });
  
  // Handle export format selection
  exportOptions.forEach(option => {
    option.addEventListener("click", () => {
      const format = option.getAttribute("data-format");
      exportData(format);
      exportDropdown.classList.remove("active");
      exportButton.setAttribute("aria-expanded", "false");
    });
  });

  // Drag-and-Drop Event Listeners
  document.addEventListener("dragover", handleDragOver);
  document.addEventListener("drop", handleFileDrop);
  document.addEventListener("dragenter", handleDragEnter);

  // Initially hide the search bar
  searchContainer.classList.remove("visible");
  
  // Toggle search options panel visibility
  function toggleSearchOptions(e) {
    e.stopPropagation();
    const isVisible = searchOptionsPanel.classList.toggle("visible");
    searchOptionsPanel.setAttribute("aria-hidden", !isVisible);
    searchOptionsToggle.setAttribute("aria-expanded", isVisible);
    
    if (isVisible) {
      searchOptionsToggle.style.transform = "rotate(180deg)";
      
      // Reset to default absolute positioning
      searchOptionsPanel.style.position = "absolute";
      searchOptionsPanel.style.top = "calc(100% + 10px)";
      searchOptionsPanel.style.right = "0";
      searchOptionsPanel.style.left = "auto";
      searchOptionsPanel.style.zIndex = "999999";
      
      // Force the output to a lower z-index with !important
      document.getElementById("output").style.cssText += "z-index: 1 !important";
      
      // Add a class to body for CSS specificity
      document.body.classList.add("search-options-active");
    } else {
      searchOptionsToggle.style.transform = "rotate(0)";
      
      // Reset styling
      document.getElementById("output").style.cssText = document.getElementById("output").style.cssText.replace("z-index: 1 !important", "");
      searchOptionsPanel.style.zIndex = "";
      
      // Remove the body class
      document.body.classList.remove("search-options-active");
    }
  }
  
  // Update search options when changed
  function updateSearchOptions() {
    searchOptions.selectedColumn = columnSelector.value;
    searchOptions.caseSensitive = caseSensitiveCheckbox.checked;
    searchOptions.useRegex = regexSearchCheckbox.checked;
    searchOptions.wholeWord = wholeWordCheckbox.checked;
    
    // If regex is enabled, whole word should be disabled because regex can use \b
    if (searchOptions.useRegex) {
      wholeWordCheckbox.disabled = true;
    } else {
      wholeWordCheckbox.disabled = false;
    }
    
    // Save options to localStorage
    localStorage.setItem(STORAGE_KEYS.SEARCH_OPTIONS, JSON.stringify(searchOptions));
    
    // Update search results with new options
    handleSearch();
  }
  
  // Update column selector options (now works with any row that has data)
  function updateColumnOptions() {
    // Store the previously selected column value
    const prevSelectedColumn = searchOptions.selectedColumn;
    
    // Clear existing options except "All Columns"
    while (columnSelector.options.length > 1) {
      columnSelector.remove(1);
    }
    
    // Add column options if data exists
    if (data && data.length > 0) {
      // Find the row with the maximum number of columns to use for headers
      let maxColumns = 0;
      let headerRow = [];
      
      data.forEach(row => {
        if (row.length > maxColumns) {
          maxColumns = row.length;
          headerRow = row;
        }
      });
      
      // Use the row with max columns for headers
      for (let i = 0; i < maxColumns; i++) {
        const option = document.createElement("option");
        option.value = i.toString();
        option.textContent = `Column ${i + 1}`;
        columnSelector.appendChild(option);
      }
    }
    
    // Check if the previously selected column still exists
    let columnStillExists = false;
    if (prevSelectedColumn !== "all") {
      for (let i = 0; i < columnSelector.options.length; i++) {
        if (columnSelector.options[i].value === prevSelectedColumn) {
          columnStillExists = true;
          break;
        }
      }
    }
    
    // Set the appropriate column
    if (prevSelectedColumn === "all" || !columnStillExists) {
      columnSelector.value = "all";
      searchOptions.selectedColumn = "all";
    } else {
      columnSelector.value = prevSelectedColumn;
    }
    
    // Save updated search options to localStorage
    localStorage.setItem(STORAGE_KEYS.SEARCH_OPTIONS, JSON.stringify(searchOptions));
    
    // If search is active, update search results
    if (searchInput.value.trim()) {
      handleSearch();
    }
  }
  
  // Handle file refresh
  function handleRefresh() {
    if (!currentFile || isRefreshing) return;
    
    // Set refreshing state
    isRefreshing = true;
    refreshButton.classList.add("refreshing");
    
    // Show loading indicator
    showLoadingIndicator();
    
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
    
    // Initialize container size
    initializeContainerSize();
    
    // Initialize search options
    initializeSearchOptions();
  }
  
  // Initialize container size from localStorage
  function initializeContainerSize() {
    const savedWidth = localStorage.getItem(STORAGE_KEYS.CONTAINER_WIDTH);
    const savedHeight = localStorage.getItem(STORAGE_KEYS.CONTAINER_HEIGHT);
    
    if (savedWidth) {
      container.style.width = savedWidth;
    }
    
    if (savedHeight) {
      container.style.height = savedHeight;
    }
  }
  
  // Save container size to localStorage
  function saveContainerSize(width, height) {
    localStorage.setItem(STORAGE_KEYS.CONTAINER_WIDTH, width);
    localStorage.setItem(STORAGE_KEYS.CONTAINER_HEIGHT, height);
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
    document.body.removeChild(a);
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
    // Apply theme class to body
    if (isDarkTheme) {
      document.body.classList.remove("light-theme");
      document.querySelector('meta[name="theme-color"]').setAttribute("content", "#0c101a");
      // Set the theme icon to moon
      const themeIcon = document.querySelector("#themeToggle span[aria-hidden='true']");
      if (themeIcon) themeIcon.textContent = "🌙";
    } else {
      document.body.classList.add("light-theme");
      document.querySelector('meta[name="theme-color"]').setAttribute("content", "#eef2fa");
      // Set the theme icon to sun
      const themeIcon = document.querySelector("#themeToggle span[aria-hidden='true']");
      if (themeIcon) themeIcon.textContent = "☀️";
    }
  }
  
  // Toggle between light and dark themes
  function toggleTheme() {
    isDarkTheme = !isDarkTheme;
    localStorage.setItem(STORAGE_KEYS.THEME, isDarkTheme ? "dark" : "light");
    
    // Update the theme toggle icon
    const themeIcon = document.querySelector("#themeToggle span[aria-hidden='true']");
    themeIcon.textContent = isDarkTheme ? "🌙" : "☀️";
    
    // Add transition class for smooth theme change
    document.body.classList.add("theme-transition");
    
    // Apply theme with slight delay for button animation
    setTimeout(() => {
      applyTheme();
      
      // Remove transition class after animation completes
      setTimeout(() => {
        document.body.classList.remove("theme-transition");
      }, 500);
    }, 100);
    
    // Announce theme change for screen readers
    announceForScreenReaders(`Switched to ${isDarkTheme ? "dark" : "light"} theme`);
  }

  // Update the loading indicator functionality
  function showLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'flex';
    
    // Add visible class after a small delay for the animation to work
    setTimeout(() => {
      loadingIndicator.classList.add('visible');
    }, 10);
    
    // Announce for screen readers
    announceForScreenReaders('Loading your file, please wait');
  }

  function hideLoadingIndicator() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    
    // First remove the visible class to trigger the fade out animation
    loadingIndicator.classList.remove('visible');
    
    // Then hide the element after the animation completes
    setTimeout(() => {
      loadingIndicator.style.display = 'none';
    }, 300);
  }

  // Update the handleFileUpload function
  function handleFileUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    currentFile = file;
    currentFileName = file.name;
    
    // Get the file extension
    const fileNameParts = file.name.split('.');
    const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
    
    // Check if the file type is valid
    if (!isValidFileType(fileExtension)) {
      showToast(`Unsupported file type: ${fileExtension}. Please use .xlsx, .xls, .csv, or .txt files.`, 'error');
      return;
    }
    
    // Show loading indicator with animation
    showLoadingIndicator();
    
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
    dragDropInstructions.classList.remove("active");
    container.style.transform = "scale(1)";
    
    // Show warning if multiple files were dropped
    if (event.dataTransfer.files.length > 1) {
      showToast("Multiple files detected. Only the first file will be processed.", "warning");
    }
    
    const file = event.dataTransfer.files[0];
    if (!file) return;
    
    // Store the file name and file object for later use
    currentFileName = file.name;
    currentFile = file;

    // Get the file extension
    const fileNameParts = file.name.split('.');
    const fileExtension = fileNameParts[fileNameParts.length - 1].toLowerCase();
    
    // Check if the file type is valid
    if (!isValidFileType(fileExtension)) {
      showToast(`Unsupported file type: ${fileExtension}. Please use .xlsx, .xls, .csv, or .txt files.`, 'error');
      return;
    }
    
    // Show loading indicator
    showLoadingIndicator();
    
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
    dragDropInstructions.classList.add("active");
    
    // Add a subtle scale animation to the container
    container.style.transform = "scale(0.995)";
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
      
      // Show the search bar
      showSearchBar();
      
      // Update column options for search
      updateColumnOptions();
      
      // Show and enable export and refresh buttons
      const actionButtons = document.getElementById("actionButtons");
      if (actionButtons) {
        actionButtons.style.display = 'flex';
      }
      exportButton.disabled = false;
      exportButton.setAttribute("aria-disabled", "false");
      refreshButton.disabled = false;
      refreshButton.setAttribute("aria-disabled", "false");
      
      // Show keyboard shortcuts button on non-mobile devices
      if (!isMobileDevice() && keyboardShortcutsButton) {
        keyboardShortcutsButton.style.display = 'inline-flex';
      }
      
      // Setup keyboard navigation
      initKeyboardNavigation();
      
      showToast("File loaded successfully!", "success");
      
      // Hide loading indicator
      hideLoadingIndicator();
      
      // Reset file input
      if (!isRefreshing) {
        fileInput.value = "";
      }
      
    } catch (error) {
      console.error("Error processing file:", error);
      showToast("Error processing file: " + error.message, "error");
      hideLoadingIndicator();
      fileInput.value = ""; // Reset file input
    }
  }

  // Clean up memory to prevent memory leaks
  function cleanupMemory() {
    // Clear data arrays
    data = [];
    originalData = [];
    
    // Don't clear UI elements here, as the displayRandomImage function will handle it
    // We'll just clean up event listeners and other references
    
    // Remove old sheet selector if it exists
    const oldSheetSelector = document.getElementById("sheetSelector");
    if (oldSheetSelector) {
      oldSheetSelector.remove();
    }
    
    // Reset file input if needed
    if (isRefreshing) {
      // Don't reset when refreshing
    } else {
      fileInput.value = "";
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
    
    // Hide search bar and reset
    searchContainer.classList.remove("visible");
    searchInput.value = "";
    
    // Display a random image in the empty state
    displayRandomImage();
    
    // Show drag-drop instructions
    dragDropInstructions.style.display = "block";
    
    // Hide action buttons container
    const actionButtons = document.getElementById("actionButtons");
    if (actionButtons) {
      actionButtons.style.display = 'none';
    }
    
    // Also disable buttons (as a fallback)
    refreshButton.disabled = true;
    exportButton.disabled = true;
    
    // Hide keyboard shortcuts button
    if (keyboardShortcutsButton) {
      keyboardShortcutsButton.style.display = 'none';
    }
  }
  
  // Create sheet selector dropdown
  function createSheetSelector(sheetNames) {
    // Remove existing selector if it exists
    const existingSelector = document.getElementById("sheetSelector");
    if (existingSelector) {
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
    
    // Insert after search bar
    searchContainer.after(selectorContainer);
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
      
      // Update column options for search
      updateColumnOptions();
      
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

  // Show search bar
  function showSearchBar() {
    searchContainer.classList.add("visible");
    setTimeout(() => {
      searchInput.focus();
    }, 300);
  }

  // Reduce drag-and-drop area size
  function reduceDragDropArea() {
    dragDropInstructions.style.padding = "5px";
    dragDropInstructions.style.fontSize = "0.8em";
    dragDropInstructions.classList.add("shrunken"); // Add a specific class to handle the visual reduction without affecting animation.
  }

  // Enable resizing functionality
  function enableResizing() {
    resizeHandle = createResizeHandle();
    container.appendChild(resizeHandle);
    addResizeListeners();
  }

  // Create resize handle element
  function createResizeHandle() {
    const handle = document.createElement("div");
    handle.classList.add("resize-handle");
    return handle;
  }

  // Add event listeners for resizing
  function addResizeListeners() {
    resizeHandle.addEventListener("mousedown", () => (isResizing = true));
    document.addEventListener("mouseup", () => {
      if (isResizing) {
        // Save container size when resizing is done
        saveContainerSize(container.style.width, container.style.height);
      }
      isResizing = false;
    });
    document.addEventListener("mousemove", resizeContainer);
  }

  // Resize container based on mouse movement
  function resizeContainer(event) {
    if (!isResizing) return;
    event.preventDefault();

    const { left, top } = container.getBoundingClientRect();
    const minWidth = 400;
    const minHeight = 300;
    const maxWidth = window.innerWidth - 40;

    const newWidth = Math.min(
      maxWidth,
      Math.max(minWidth, event.clientX - left)
    );
    const newHeight = Math.max(minHeight, event.clientY - top);

    container.style.width = `${newWidth}px`;
    container.style.height = `${newHeight}px`;
  }

  // Cleanup event listeners on page unload
  window.addEventListener("beforeunload", () => {
    document.removeEventListener("mouseup", () => (isResizing = false));
    document.removeEventListener("mousemove", resizeContainer);
  });

  // Handle search functionality
  function handleSearch() {
    const searchText = searchInput.value.trim();
    
    // Skip if search text is empty
    if (searchText === "") {
      // Clear all highlights
      const highlightedCells = document.querySelectorAll("td.highlight");
      highlightedCells.forEach(cell => cell.classList.remove("highlight"));
      scrollToTop();
      return;
    }
    
    const cells = document.querySelectorAll("td.non-empty");
    let firstMatch = null;
    
    // Prepare regex pattern if regex search is enabled
    let searchPattern = null;
    if (searchOptions.useRegex) {
      try {
        searchPattern = new RegExp(
          searchOptions.wholeWord ? `\\b${searchText}\\b` : searchText,
          searchOptions.caseSensitive ? "" : "i"
        );
      } catch (error) {
        console.error("Invalid regex pattern:", error);
        // Show error toast for invalid regex
        showToast("Invalid regular expression: " + error.message, "error");
        // Fall back to normal search if regex is invalid
        searchPattern = null;
      }
    }

    cells.forEach((cell) => {
      // Skip if not matching the selected column
      if (searchOptions.selectedColumn !== "all") {
        const columnIndex = parseInt(searchOptions.selectedColumn);
        if (parseInt(cell.dataset.col) !== columnIndex) {
          cell.classList.remove("highlight");
          return;
        }
      }
      
      const cellText = cell.textContent;
      let isMatch = false;
      
      if (searchPattern) {
        // Regex search
        isMatch = searchPattern.test(cellText);
      } else if (searchOptions.wholeWord) {
        // Whole word search (non-regex)
        const wordBoundary = "\\b";
        const escapedText = escapeRegExp(searchText);
        const wholeWordPattern = new RegExp(
          `${wordBoundary}${escapedText}${wordBoundary}`, 
          searchOptions.caseSensitive ? "" : "i"
        );
        isMatch = wholeWordPattern.test(cellText);
      } else {
        // Simple text search
        if (searchOptions.caseSensitive) {
          isMatch = cellText.includes(searchText);
        } else {
          isMatch = cellText.toLowerCase().includes(searchText.toLowerCase());
        }
      }
      
      cell.classList.toggle("highlight", isMatch);
      
      if (isMatch && !firstMatch) {
        firstMatch = cell;
      }
    });

    // Scroll to the first match if found
    if (firstMatch) {
      setTimeout(() => scrollToVisible(firstMatch), 200);
    } else if (searchText) {
      // Nothing found with search text
      scrollToTop();
    }
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

  // Function to display data with improved styling for glassomorphic UI
  function displayData(parsedData) {
    if (!parsedData || !parsedData.length) {
      return;
    }

    const output = document.getElementById("output");
    output.innerHTML = "";
    data = parsedData;

    // Create search bar if it doesn't exist yet
    showSearchBar();
    
    // Show the refresh button
    refreshButton.disabled = false;
    
    // Make export button accessible
    exportButton.disabled = false;

    // Create table
    const table = document.createElement("table");
    table.setAttribute("tabindex", "0"); // Make table focusable for keyboard navigation
    
    // Calculate max columns from all rows to ensure all data is shown
    let maxColumns = 0;
    parsedData.forEach(row => {
      if (row.length > maxColumns) {
        maxColumns = row.length;
      }
    });
    
    // Create table body
    const tbody = document.createElement("tbody");
    
    // Add data rows
    parsedData.forEach((row, rowIndex) => {
      const tr = createTableRow(row, rowIndex);
      tbody.appendChild(tr);
    });
    
    table.appendChild(tbody);
    output.appendChild(table);
    
    // Add keyboard navigation event handler
    table.addEventListener("keydown", handleTableKeydown);
    
    // Reduce the drag-drop area size
    reduceDragDropArea();
    
    // Update column options for search
    updateColumnOptions();
    
    // Initialize keyboard navigation
    initKeyboardNavigation();
  }

  // Create a table row
  function createTableRow(row, rowIndex) {
    const tr = document.createElement("tr");
    row.forEach((cell, columnIndex) => {
      const td = createTableCell(cell, rowIndex, columnIndex);
      tr.appendChild(td);
    });
    return tr;
  }

  // Create a table cell
  function createTableCell(cell, rowIndex, columnIndex) {
    const td = document.createElement("td");
    td.textContent = cell;
    td.dataset.row = rowIndex;
    td.dataset.col = columnIndex;
    if (cell !== "") td.classList.add("non-empty");
    
    // Add event listeners for cell interaction
    td.addEventListener("click", () => handleCellClick(td));
    
    // Always add double-click event listener for desktop, only skip on mobile
    if (!isMobileDevice()) {
      td.addEventListener("dblclick", () => startEditing(td));
    }
    
    return td;
  }

  // Handle cell click event
  function handleCellClick(cell) {
    // Skip if already in editing mode
    if (isEditing) return;
    
    if (cell.classList.contains("non-empty")) {
      copyToClipboard(cell.textContent);
      highlightCell(cell);
    }
  }

  // Copy text to clipboard
  function copyToClipboard(value) {
    // Try using the modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(value.trim())
        .then(() => showToast(`Copied! - "${value.trim()}"`, "success"))
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
      document.body.removeChild(textArea);
      
      if (successful) {
        showToast(`Copied! - "${text}"`, "success");
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

  // Show toast notification with improved animation for glassomorphic UI
  function showToast(message, type = "success") {
    const toastContainer = document.getElementById("toastContainer");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    // Add an icon based on the type
    const icon = document.createElement("span");
    icon.className = "toast-icon";
    icon.setAttribute("aria-hidden", "true");
    
    if (type === "success") {
      icon.textContent = "✓";
    } else if (type === "warning") {
      icon.textContent = "!";
    } else {
      icon.textContent = "✕";
    }
    
    // Create a text container for the message
    const textSpan = document.createElement("span");
    textSpan.className = "toast-text";
    textSpan.textContent = message;
    
    // Build toast structure
    toast.appendChild(icon);
    toast.appendChild(textSpan);
    
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
    
    // Remove the toast after 2 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      toast.addEventListener("transitionend", () => {
        toastContainer.removeChild(toast);
      });
    }, 2000);
  }

  // Initialize search options from localStorage
  function initializeSearchOptions() {
    const savedOptions = localStorage.getItem(STORAGE_KEYS.SEARCH_OPTIONS);
    if (savedOptions) {
      try {
        const parsedOptions = JSON.parse(savedOptions);
        searchOptions = {
          ...searchOptions,
          ...parsedOptions
        };
        
        // Apply saved options to UI elements
        caseSensitiveCheckbox.checked = searchOptions.caseSensitive;
        regexSearchCheckbox.checked = searchOptions.useRegex;
        wholeWordCheckbox.checked = searchOptions.wholeWord;
        
        // Set whole word checkbox disabled state based on regex
        wholeWordCheckbox.disabled = searchOptions.useRegex;
        
        // We'll set the column selector value after populating it with options
        // This happens in updateColumnOptions()
      } catch (error) {
        console.error("Error parsing saved search options:", error);
      }
    }
  }
  
  // Helper function to escape regex special characters
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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
        case "f":
          // Focus on search input when Ctrl+F is pressed
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            searchInput.focus();
            searchInput.select();
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
      
      // Update column options for search
      updateColumnOptions();
      
      // Handle search
      handleSearch();
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
      { key: "Ctrl+F", description: "Focus search box" },
      { key: "Ctrl+C", description: "Copy selected cell content" },
      { key: "Ctrl+R", description: "Refresh data" },
      { key: "Ctrl+E", description: "Export menu" },
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
  function announceForScreenReaders(message) {
    const announcer = document.createElement("div");
    announcer.setAttribute("aria-live", "assertive");
    announcer.setAttribute("role", "status");
    announcer.className = "sr-only";
    document.body.appendChild(announcer);
    
    // Use setTimeout to ensure the element is in the DOM before setting text
    setTimeout(() => {
      announcer.textContent = message;
      
      // Remove after announcement is made
      setTimeout(() => {
        // Check if the node is still in the document before removing
        if (document.body.contains(announcer)) {
          document.body.removeChild(announcer);
        }
      }, 1000);
    }, 100);
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

  // Initialize the application
  initializeSettings();
  initKeyboardNavigation();
  
  // Make drag-drop instructions accessible with keyboard
  dragDropInstructions.addEventListener("keydown", function(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInput.click();
    }
  });
  
  // Announce application ready for screen readers
  setTimeout(() => {
    announceForScreenReaders("Bread Sheet application ready. Press Alt+K for keyboard shortcuts.");
  }, 1000);

  // Animate the mobile add button
  function animateMobileButton() {
    if (window.innerWidth <= 800) {
      setTimeout(() => {
        mobileAddButton.style.transform = "scale(1)";
        mobileAddButton.style.opacity = "1";
      }, 500);
    }
  }
  
  // Add resize event listener to handle mobile button visibility
  window.addEventListener("resize", debounce(() => {
    if (window.innerWidth <= 800) {
      mobileAddButton.style.transform = "scale(1)";
      mobileAddButton.style.opacity = "1";
      
      // Hide keyboard shortcuts button on mobile
      if (keyboardShortcutsButton) {
        keyboardShortcutsButton.style.display = 'none';
      }
      
      // Hide mobile hint message
      const mobileHint = document.querySelector('.mobile-hint');
      if (mobileHint) {
        mobileHint.style.display = 'none';
      }
    } else {
      mobileAddButton.style.transform = "scale(0)";
      mobileAddButton.style.opacity = "0";
      
      // Show keyboard shortcuts button on desktop
      if (keyboardShortcutsButton) {
        keyboardShortcutsButton.style.display = '';
      }
    }
  }, 250));

  // Add special handling for select dropdown to ensure it's visible
  columnSelector.addEventListener("mousedown", function() {
    // Add special class that applies the highest z-index when dropdown is clicked
    document.body.classList.add("select-dropdown-active");
    
    // Ensure the dropdown appears on top
    setTimeout(() => {
      document.getElementById("output").style.cssText += "z-index: 1 !important";
      searchOptionsPanel.style.zIndex = "9999999";
      columnSelector.style.zIndex = "10000000";
      
      // Add event listener to reset when focus is lost
      const resetDropdown = () => {
        document.body.classList.remove("select-dropdown-active");
        document.removeEventListener("mousedown", resetDropdown);
      };
      
      document.addEventListener("mousedown", resetDropdown);
    }, 10);
  });

  // Function to display a random image when no file is loaded
  function displayRandomImage() {
    const output = document.getElementById("output");
    
    // Clear any existing content
    output.innerHTML = "";
    
    // Add image-display class to output
    output.classList.add("image-display");
    
    // First get container dimensions - if container has its display style set properly
    const containerRect = container.getBoundingClientRect();
    const outputRect = output.getBoundingClientRect();
    
    // Initialize dimensions
    let imageWidth, imageHeight;
    
    // Choose the best dimensions by checking if element rectangles are valid
    if (outputRect.width > 50 && outputRect.height > 50) {
      // Use full output dimensions
      imageWidth = Math.round(outputRect.width);
      imageHeight = Math.round(outputRect.height);
      console.log("Using output dimensions:", imageWidth, "x", imageHeight);
    } else if (containerRect.width > 50 && containerRect.height > 50) {
      // Use container dimensions with minimal reduction
      imageWidth = Math.round(containerRect.width * 0.95);
      imageHeight = Math.round(containerRect.height * 0.8); 
      console.log("Using container dimensions:", imageWidth, "x", imageHeight);
    } else {
      // Final fallback to viewport-based sizing
      if (window.innerWidth <= 768) {
        imageWidth = window.innerWidth * 0.9;
        imageHeight = window.innerHeight * 0.6;
      } else {
        imageWidth = window.innerWidth * 0.8;
        imageHeight = window.innerHeight * 0.7;
      }
      console.log("Using viewport dimensions:", imageWidth, "x", imageHeight);
    }
    
    // Round dimensions to nearest 50px for better caching
    imageWidth = Math.floor(imageWidth / 50) * 50;
    imageHeight = Math.floor(imageHeight / 50) * 50;
    
    // Ensure minimum dimensions
    imageWidth = Math.max(imageWidth, 300);
    imageHeight = Math.max(imageHeight, 200);
    
    // Create a random image using picsum.photos with grayscale
    // Use a simple dimension-based URL for better compatibility
    const randomSeed = Math.floor(Math.random() * 1000);
    const imageUrl = `https://picsum.photos/seed/${randomSeed}/${imageWidth}/${imageHeight}?grayscale`;
    
    console.log("Loading image from:", imageUrl);
    
    // Create image container - centered with flex
    const imageContainer = document.createElement("div");
    imageContainer.className = "image-container";
    imageContainer.style.width = "100%";
    imageContainer.style.height = "100%";
    imageContainer.style.display = "flex";
    imageContainer.style.alignItems = "center";
    imageContainer.style.justifyContent = "center";
    imageContainer.style.overflow = "hidden";
    imageContainer.style.position = "relative";
    imageContainer.style.backgroundColor = "var(--color-bg)";
    
    // Create image element - preserve aspect ratio
    const imgElement = document.createElement("img");
    imgElement.src = imageUrl;
    imgElement.alt = "Random background image";
    imgElement.classList.add("random-background-image");
    
    // Style for natural aspect ratio - don't stretch
    imgElement.style.maxWidth = "100%";
    imgElement.style.maxHeight = "100%";
    imgElement.style.width = "auto";
    imgElement.style.height = "auto";
    imgElement.style.objectFit = "contain";
    imgElement.style.position = "relative"; // Don't use absolute positioning
    imgElement.style.top = "auto";
    imgElement.style.left = "auto";
    
    // Add resize listener to handle window resize
    const resizeListener = () => {
      // Only update if container dimensions change significantly
      const newOutputRect = output.getBoundingClientRect();
      if (Math.abs(newOutputRect.width - outputRect.width) > 100 || 
          Math.abs(newOutputRect.height - outputRect.height) > 100) {
        // Remove this listener to avoid duplication
        window.removeEventListener('resize', resizeListener);
        
        // Reload the image with new dimensions
        displayRandomImage();
      }
    };
    
    // Add the resize listener
    window.addEventListener('resize', debounce(resizeListener, 250));
    
    // Add load event listener to handle when image is fully loaded
    imgElement.addEventListener('load', () => {
      console.log('Image loaded successfully:', imageUrl);
      
      // Position the drag-drop instructions over the image - at the bottom
      if (dragDropInstructions) {
        // Make drag-drop instructions appear above the image
        dragDropInstructions.style.display = "flex";
        
        // If the drag-drop area was shrunk previously, restore its normal size
        dragDropInstructions.classList.remove("shrunken");
        
        // Position at the bottom with margins
        dragDropInstructions.style.margin = "1rem auto";
        
        // Use relative positioning
        dragDropInstructions.style.position = "relative";
        dragDropInstructions.style.zIndex = "20";
        
        // Remove centering styles
        dragDropInstructions.style.top = "";
        dragDropInstructions.style.left = "";
        dragDropInstructions.style.transform = "";
        
        // Ensure proper transparency and attractive styling
        if (document.body.classList.contains('light-theme')) {
          dragDropInstructions.style.backgroundColor = "rgba(245, 247, 250, 0.75)";
        } else {
          dragDropInstructions.style.backgroundColor = "rgba(35, 39, 47, 0.75)";
        }
      }
    });
    
    // Add error handler in case image fails to load
    imgElement.addEventListener('error', () => {
      console.error('Failed to load random image:', imageUrl);
      
      // Try with a different seed
      const newSeed = Math.floor(Math.random() * 1000) + 1000;
      const fallbackUrl = `https://picsum.photos/seed/${newSeed}/800/600?grayscale`;
      console.log('Trying fallback URL:', fallbackUrl);
      imgElement.src = fallbackUrl;
      
      // Add one more fallback for the final attempt
      imgElement.addEventListener('error', () => {
        console.error('Second attempt failed, using final fallback');
        // Try the simplest format as last resort
        imgElement.src = 'https://picsum.photos/800/600?grayscale';
      });
    });
    
    // Append image to container
    imageContainer.appendChild(imgElement);
    
    // Append container to output
    output.appendChild(imageContainer);
    
    // Set output area styling to ensure full coverage
    output.style.padding = "0";
    output.style.overflow = "hidden";
    output.style.height = "100%";
    output.style.position = "relative";
  }

  // Helper function to reset output styling for data display
  function resetOutputForDataDisplay(outputElement) {
    // Remove styling applied by displayRandomImage
    outputElement.style.padding = "";
    outputElement.style.overflow = "";
    outputElement.style.height = "";
    outputElement.style.display = "";
    outputElement.style.alignItems = "";
    outputElement.style.justifyContent = "";
    outputElement.style.position = "";
    outputElement.classList.remove("image-display");
    
    // Reset any drag-drop instruction styling changes
    if (dragDropInstructions) {
      dragDropInstructions.style.backgroundColor = "";
      dragDropInstructions.style.position = "";
      dragDropInstructions.style.top = "";
      dragDropInstructions.style.left = "";
      dragDropInstructions.style.transform = "";
      dragDropInstructions.style.margin = "";
      dragDropInstructions.style.zIndex = "";
      dragDropInstructions.style.display = "";
    }
  }
}