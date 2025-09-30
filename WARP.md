# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**Bread Sheet** is a modern web-based spreadsheet data manipulation tool built with vanilla HTML, CSS, and JavaScript. It offers a glassomorphic UI with drag-and-drop file upload capabilities and supports Excel (.xlsx, .xls), CSV (.csv), and text (.txt) files.

**Live Application**: https://ajayparihar.github.io/Bread-Sheet

## Architecture

### Core Components

- **Frontend Only**: Pure client-side application with no backend dependencies
- **Single Page Application**: All functionality contained in `index.html`, `script.js`, and `styles.css`
- **File Processing**: Uses SheetJS (XLSX) library for parsing Excel/CSV files
- **Theme System**: CSS custom properties for light/dark theme switching
- **Responsive Design**: Mobile-first approach with desktop enhancements

### Key Files

- `index.html` - Main application structure with semantic HTML and accessibility features
- `script.js` - Core application logic (~2,300 lines) handling file processing, UI interactions, and data management
- `styles.css` - Glassomorphic design system with CSS custom properties for theming
- `fetch_bmtc_data.py` - Python utility script (separate from main web app)
- `test.html` - Testing/development page

### JavaScript Architecture

The main application (`script.js`) follows a modular pattern within a single IIFE:

1. **Initialization System** - Settings loaded from localStorage (theme, container size, search options)
2. **File Processing Pipeline** - Drag-and-drop → File reading → Data parsing → Display
3. **Data Management** - In-memory data structures with refresh capabilities
4. **Search System** - Advanced search with regex, case sensitivity, and column filtering
5. **Export System** - Multiple format support (Excel, CSV, HTML, TXT)
6. **Keyboard Navigation** - Full keyboard accessibility with cell editing
7. **Theme Management** - Dynamic CSS custom property manipulation

## Development Commands

### Local Development
```bash
# Serve locally (any static file server)
python -m http.server 8000
# or
npx serve .
# or
php -S localhost:8000
```

### Testing the Application
```bash
# Open in browser
start http://localhost:8000
# or on macOS/Linux
open http://localhost:8000
```

### Linting/Formatting
No build tools configured - uses vanilla web technologies. For development:
```bash
# HTML validation
npx html-validate index.html

# CSS validation  
npx stylelint styles.css

# JavaScript linting
npx eslint script.js
```

## Key Development Patterns

### Memory Management
- Explicit cleanup in `cleanupMemory()` function
- Event listener management for dynamic content
- File object caching for refresh functionality

### State Management
- Global variables within IIFE scope
- LocalStorage persistence for user preferences
- Data/originalData arrays for change tracking

### Error Handling
- Try-catch blocks around file operations
- User-friendly toast notifications via `showToast()`
- Graceful degradation for unsupported browsers

### Accessibility
- Full keyboard navigation support
- ARIA attributes and roles
- Screen reader announcements
- Focus management system

## Data Flow

1. **File Upload** → File validation → FileReader API → XLSX parsing
2. **Data Processing** → Array of arrays format → Display in HTML table
3. **Search** → Filter data → Highlight matching cells → Scroll to results
4. **Export** → Convert data → Generate blob → Trigger download
5. **Edit** → In-place editing → Update data arrays → Refresh display

## Mobile Considerations

- Responsive breakpoint at 800px
- Touch-optimized interactions
- Mobile-specific UI elements (floating add button)
- Keyboard shortcuts disabled on mobile devices

## Browser Support

- Modern browsers with ES6+ support
- FileReader API and Blob support required
- CSS Grid and Flexbox support needed
- Optional: Clipboard API for enhanced copy functionality

## Performance Notes

- Large files (>10MB) may cause memory issues
- Table rendering is synchronous - large datasets may block UI
- Search is debounced (300ms) to prevent excessive filtering
- Uses `requestAnimationFrame` for smooth animations

## Deployment

Static site deployment - no server-side processing required:
- GitHub Pages (current deployment)
- Netlify, Vercel, or similar static hosts
- Any web server capable of serving static files

## Common Tasks

### Adding New File Format Support
1. Update `isValidFileType()` function
2. Add parser function (follow `parseCSV()` pattern)
3. Update file input `accept` attribute
4. Add to error messages and documentation

### Modifying Export Formats
1. Add new format to `exportData()` switch statement
2. Create export function following existing patterns
3. Update dropdown menu in `index.html`
4. Test with various data types

### Theme Customization
1. Modify CSS custom properties in `:root` and `body.light-theme`
2. Ensure both light and dark themes are updated
3. Test all UI states (hover, focus, active)
4. Verify accessibility contrast ratios

### Adding Keyboard Shortcuts
1. Add to `initKeyboardNavigation()` event listener
2. Update `showKeyboardShortcutsLegend()` with new shortcuts
3. Ensure mobile devices are excluded where appropriate
4. Test for conflicts with browser shortcuts

## External Dependencies

- **SheetJS (XLSX)**: `https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js`
- No other runtime dependencies

## Security Considerations

- Client-side only processing - files never leave user's device
- No external API calls from main application
- CSP headers recommended for enhanced security
- File type validation prevents potential security issues