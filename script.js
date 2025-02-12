// Bread Sheet - Main JavaScript
// Developer: Ajay Singh
// Version: 1.1
// Date: 04-06-2024
// Description: This script handles file reading (Excel/CSV), displays data in a table,
//              provides search functionality, and allows resizing of the main container.

document.addEventListener("DOMContentLoaded", init);

function init() {
  // DOM Elements
  const fileInput = document.getElementById("fileInput");
  const searchContainer = document.querySelector(".search-bar");
  const searchInput = document.getElementById("searchInput");
  const container = document.querySelector(".container");
  const dragDropInstructions = document.querySelector(
    ".drag-drop-instructions"
  );

  let resizeHandle,
    data = [],
    lastClickedCell = null,
    isResizing = false;

  // Event Listeners
  fileInput.addEventListener("change", handleFileUpload);
  searchInput.addEventListener("input", debounce(handleSearch, 300));
  document
    .getElementById("projectTitle")
    .addEventListener("click", refreshPage);
  document
    .getElementById("projectTitle")
    .addEventListener("mousedown", handleTitleMouseDown);

  // Drag-and-Drop Event Listeners
  document.addEventListener("dragover", handleDragOver);
  document.addEventListener("drop", handleFileDrop);
  document.addEventListener("dragenter", handleDragEnter);

  // Initially hide the search bar
  searchContainer.classList.remove("visible");

  // Handle file upload via input
  function handleFileUpload(event) {
    try {
      const file = event.target.files[0];
      if (!file) return showAlert("No file selected.", "error");

      const reader = new FileReader();
      const extension = file.name.split(".").pop().toLowerCase();

      if (!isValidFileType(extension)) {
        fileInput.value = "";
        return showAlert(
          "Unsupported file type. Please upload an Excel, CSV, or TXT file.",
          "error"
        );
      }

      reader.onerror = () => {
        showAlert("Error reading file.", "error");
        fileInput.value = "";
      };

      reader.onload = (e) => loadData(e.target.result, extension);
      const readMethod = ["xlsx", "xls"].includes(extension)
        ? "readAsArrayBuffer"
        : "readAsText";
      reader[readMethod](file);
    } catch (error) {
      showAlert("Error processing file: " + error.message, "error");
      fileInput.value = "";
    }
  }

  // Handle file drop via drag-and-drop
  function handleFileDrop(event) {
    console.log("File dropped.");
    event.preventDefault();
    dragDropInstructions.classList.remove("drag-over");
    const file = event.dataTransfer.files[0];
    if (!file) return showAlert("No file selected.", "error");

    const reader = new FileReader();
    const extension = file.name.split(".").pop().toLowerCase();

    if (!isValidFileType(extension))
      return showAlert(
        "Unsupported file type. Please upload an Excel, CSV, or TXT file.",
        "error"
      );

    reader.onload = (e) => loadData(e.target.result, extension);
    const readMethod = ["xlsx", "xls"].includes(extension)
      ? "readAsArrayBuffer"
      : "readAsText";
    reader[readMethod](file);
  }

  // Prevent default behavior for drag over
  function handleDragOver(event) {
    event.preventDefault();
  }

  // Highlight drag-and-drop area on drag enter
  function handleDragEnter(event) {
    event.preventDefault();
    dragDropInstructions.classList.add("drag-over");
  }

  // Load data from the uploaded file
  function loadData(rawData, extension) {
    try {
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
        return showAlert(
          "Unsupported file format or error parsing file.",
          "error"
        );
      }

      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

      displayData(data);
      showSearchBar();
      enableResizing();
      container.style.width = "100%";
      reduceDragDropArea();
    } catch (error) {
      showAlert("Error reading file: " + error.message, "error");
      console.error("Error reading file:", error);
    }
  }

  // Validate file type
  function isValidFileType(extension) {
    return ["xlsx", "xls", "csv", "txt"].includes(extension);
  }

  // Show search bar
  function showSearchBar() {
    searchContainer.classList.add("visible");
    searchInput.disabled = false;
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
    document.addEventListener("mouseup", () => (isResizing = false));
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
    const searchText = searchInput.value.trim().toLowerCase();
    const cells = document.querySelectorAll("td.non-empty");
    let firstMatch = null;

    cells.forEach((cell) => {
      const text = cell.textContent.toLowerCase();
      const isMatch = searchText && text.includes(searchText);
      cell.classList.toggle("highlight", isMatch);

      if (isMatch && !firstMatch) firstMatch = cell;
    });

    if (searchText === "") scrollToTop();
    else if (firstMatch) setTimeout(() => scrollToVisible(firstMatch), 200);
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

  // Display data in a table
  function displayData(data) {
    const output = document.getElementById("output");
    output.innerHTML = "";

    const table = document.createElement("table");
    data.forEach((row, rowIndex) => createTableRow(row, rowIndex, table));
    output.appendChild(table);
  }

  // Create a table row
  function createTableRow(row, rowIndex, table) {
    const tr = document.createElement("tr");
    row.forEach((cell, columnIndex) => {
      const td = createTableCell(cell, rowIndex, columnIndex);
      tr.appendChild(td);
    });
    table.appendChild(tr);
  }

  // Create a table cell
  function createTableCell(cell, rowIndex, columnIndex) {
    const td = document.createElement("td");
    td.textContent = cell;
    td.dataset.row = rowIndex;
    td.dataset.col = columnIndex;
    if (cell !== "") td.classList.add("non-empty");
    td.addEventListener("click", () => handleCellClick(td));
    return td;
  }

  // Handle cell click event
  function handleCellClick(cell) {
    if (cell.classList.contains("non-empty")) {
      copyToClipboard(cell.textContent);
      highlightCell(cell);
    }
  }

  // Copy text to clipboard
  function copyToClipboard(value) {
    navigator.clipboard
      .writeText(value.trim())
      .then(() => showAlert(`Copied! - "${value.trim()}"`, "success"))
      .catch((err) => showAlert("Failed to copy text: " + err, "error"));
  }

  // Highlight the clicked cell
  function highlightCell(cell) {
    if (lastClickedCell) lastClickedCell.classList.remove("last-clicked");
    cell.classList.add("last-clicked");
    lastClickedCell = cell;
  }

  // Show alert message
  function showAlert(message, type) {
    const existingToast = document.querySelector(".toast");
    if (existingToast) {
      existingToast.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(existingToast);
      }, 300);
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 100);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 2300);
  }
}
