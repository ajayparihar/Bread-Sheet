/**
 * BREAD SHEET - COMPREHENSIVE DESIGN SYSTEM CONSTANTS
 * 
 * This file establishes a comprehensive design token system that serves as the
 * single source of truth for all visual design properties across the application.
 * Design tokens ensure consistency, maintainability, and systematic design evolution.
 * 
 * @fileoverview Design token system implementing systematic visual consistency
 * @author Ajay Singh
 * @version 1.0
 * @date 2024
 * 
 * DESIGN TOKEN PHILOSOPHY:
 * Design tokens represent design decisions as data, enabling:
 * - Systematic consistency across all interface elements
 * - Effortless theme switching and brand customization
 * - Maintainable design systems that scale across teams and projects
 * - Automated design-to-development workflows
 * - Clear documentation of design intentions and rationale
 * 
 * TOKEN CATEGORIES & ORGANIZATION:
 * 1. PRIMITIVE TOKENS (Base Values):
 *    - Colors: Raw color values with semantic naming
 *    - Typography: Font sizes, weights, line heights, and families
 *    - Spacing: Mathematical scale for consistent rhythm
 *    - Dimensions: Component sizes and layout constraints
 * 
 * 2. SEMANTIC TOKENS (Purpose-Specific):
 *    - Theme Colors: Context-specific color assignments
 *    - Shadows: Elevation system for visual hierarchy
 *    - Border Radius: Corner rounding for component styling
 *    - Animations: Timing functions and duration standards
 * 
 * 3. COMPONENT TOKENS (Component-Specific):
 *    - Loading indicators, toast notifications, table systems
 *    - Search functionality, accessibility features
 *    - Z-index layering and responsive breakpoints
 * 
 * INTEGRATION PATTERNS:
 * - JavaScript Integration: Direct import and usage in component logic
 * - CSS Integration: Token values inform CSS custom property definitions
 * - Theme Management: Tokens enable systematic theme switching
 * - Component Systems: Tokens ensure consistent component behavior
 * 
 * NAMING CONVENTIONS:
 * - SCREAMING_SNAKE_CASE for constant visibility and IDE support
 * - Hierarchical naming with clear semantic meaning
 * - Self-documenting names that communicate intent
 * - Consistent patterns across all token categories
 */

// =============================================================================
// COLOR SYSTEM
// =============================================================================

/**
 * BASE COLOR PALETTE - PRIMITIVE COLOR TOKENS
 * 
 * These foundational color values serve as the building blocks for the entire
 * color system. Each color is meticulously selected for optimal contrast,
 * accessibility compliance, and visual harmony across theme variations.
 * 
 * COLOR SELECTION METHODOLOGY:
 * - Accessibility: All colors meet or exceed WCAG AA standards (4.5:1 contrast)
 * - Perceptual Uniformity: Colors maintain consistent perceived brightness
 * - Theme Flexibility: Values work effectively in both light and dark contexts
 * - Brand Alignment: Colors reflect professional, modern aesthetic
 * 
 * USAGE PATTERNS:
 * - PRIMARY COLORS: Core brand colors for primary interface elements
 * - GRAYSCALE: Systematic neutral palette for backgrounds, text, and borders
 * - SEMANTIC COLORS: Status colors with universal recognition (success, error, etc.)
 * - TRANSPARENCY VALUES: Alpha channel variants for layering and depth
 * 
 * TECHNICAL SPECIFICATIONS:
 * - Color Space: sRGB color space for consistent cross-platform rendering
 * - Precision: Hex values chosen for exact color reproduction
 * - Compatibility: Colors tested across multiple displays and color profiles
 */
export const COLORS = {
  // Primary brand colors
  WHITE: '#FDFDFD',
  BLACK: '#131313',
  
  // Grayscale system (50-900 scale)
  GRAY_50: '#F9F9F9',
  GRAY_100: '#F0F0F0',
  GRAY_200: '#E5E5E5',
  GRAY_300: '#D1D1D1',
  GRAY_400: '#A3A3A3',
  GRAY_500: '#737373',
  GRAY_600: '#525252',
  GRAY_700: '#404040',
  GRAY_800: '#262626',
  GRAY_900: '#171717',
  
  // Semantic colors
  SUCCESS: '#16A34A',
  WARNING: '#D97706',
  ERROR: '#DC2626',
  INFO: '#388497',
  
  // Transparent colors
  TRANSPARENT: 'transparent',
  
  // Common RGBA values
  BLACK_10: 'rgba(0, 0, 0, 0.1)',
  BLACK_20: 'rgba(0, 0, 0, 0.2)',
  BLACK_30: 'rgba(0, 0, 0, 0.3)',
  BLACK_50: 'rgba(0, 0, 0, 0.5)',
  WHITE_10: 'rgba(255, 255, 255, 0.1)',
  WHITE_20: 'rgba(255, 255, 255, 0.2)',
  WHITE_30: 'rgba(255, 255, 255, 0.3)',
  WHITE_50: 'rgba(255, 255, 255, 0.5)',
};

/**
 * THEME-SPECIFIC COLOR MAPPINGS - CONTEXTUAL COLOR SYSTEM
 * 
 * This section defines semantic color assignments that automatically adapt
 * based on the active theme. These mappings ensure optimal contrast, readability,
 * and visual hierarchy across both light and dark theme variations.
 * 
 * SEMANTIC MAPPING PRINCIPLES:
 * - Context Awareness: Colors change meaning based on theme context
 * - Accessibility Preservation: Contrast ratios maintained across themes
 * - Visual Hierarchy: Color relationships preserved in all theme states
 * - Brand Consistency: Core brand identity maintained across variations
 * 
 * THEME DESIGN PHILOSOPHY:
 * - DARK THEME: Default theme optimized for reduced eye strain and modern aesthetic
 * - LIGHT THEME: Alternative theme for high-brightness environments and user preference
 * - Automatic Adaptation: System-level theme detection with user override capability
 * - Smooth Transitions: CSS custom properties enable seamless theme switching
 * 
 * COLOR ROLE DEFINITIONS:
 * - BG_*: Background colors for different surface levels and contexts
 * - TEXT_*: Typography colors with appropriate contrast for readability
 * - BORDER_*: Edge definition colors for component boundaries and separators
 * - ACCENT_*: Interactive element colors for buttons, links, and highlights
 * - STATUS_*: Semantic colors for success, warning, error, and information states
 */
export const THEME_COLORS = {
  DARK: {
    // Background colors
    BG_PRIMARY: COLORS.BLACK,
    BG_SECONDARY: COLORS.GRAY_900,
    BG_TERTIARY: COLORS.GRAY_800,
    
    // Text colors
    TEXT_PRIMARY: COLORS.WHITE,
    TEXT_SECONDARY: COLORS.GRAY_400,
    TEXT_MUTED: COLORS.GRAY_500,
    
    // Border colors
    BORDER: COLORS.GRAY_800,
    BORDER_LIGHT: COLORS.GRAY_900,
    
    // Accent colors
    ACCENT_PRIMARY: COLORS.WHITE,
    ACCENT_HOVER: '#F5F5F5',
    
    // Status colors (same across themes)
    SUCCESS: COLORS.SUCCESS,
    WARNING: COLORS.WARNING,
    ERROR: COLORS.ERROR,
    INFO: COLORS.INFO,
  },
  
  LIGHT: {
    // Background colors
    BG_PRIMARY: COLORS.WHITE,
    BG_SECONDARY: COLORS.GRAY_50,
    BG_TERTIARY: COLORS.GRAY_100,
    
    // Text colors
    TEXT_PRIMARY: COLORS.BLACK,
    TEXT_SECONDARY: COLORS.GRAY_600,
    TEXT_MUTED: COLORS.GRAY_400,
    
    // Border colors
    BORDER: COLORS.GRAY_200,
    BORDER_LIGHT: COLORS.GRAY_100,
    
    // Accent colors
    ACCENT_PRIMARY: COLORS.BLACK,
    ACCENT_HOVER: '#0F0F0F',
    
    // Status colors (same across themes)
    SUCCESS: COLORS.SUCCESS,
    WARNING: COLORS.WARNING,
    ERROR: COLORS.ERROR,
    INFO: COLORS.INFO,
  }
};

// =============================================================================
// TYPOGRAPHY SYSTEM
// =============================================================================

/**
 * FONT SIZES - SYSTEMATIC TYPOGRAPHY SCALE
 * 
 * A mathematically-derived font size system that creates consistent visual
 * hierarchy and optimal readability across all interface elements. This scale
 * follows modular design principles for systematic typography.
 * 
 * SCALE METHODOLOGY:
 * - Base Size: 16px (browser default) for optimal readability and accessibility
 * - Modular Ratio: 1.25 (Major Third) for harmonious size relationships
 * - Accessibility: All sizes meet minimum 12px requirement for readability
 * - Cross-Platform: Sizes optimized for consistent rendering across devices
 * 
 * USAGE GUIDELINES:
 * - XS (12px): Captions, footnotes, micro-copy, metadata
 * - SM (14px): Secondary text, labels, form inputs, navigation
 * - BASE (16px): Body text, primary content, default reading size
 * - LG (18px): Emphasized text, lead paragraphs, important information
 * - XL-5XL: Heading hierarchy from h6 to h1, display text
 * 
 * ACCESSIBILITY CONSIDERATIONS:
 * - Minimum 12px size ensures readability for users with visual impairments
 * - Sufficient size differentials for clear hierarchy recognition
 * - Compatible with browser zoom functionality (up to 200%)
 * - Responsive scaling maintains proportions across viewport sizes
 */
export const FONT_SIZES = {
  XS: '12px',
  SM: '14px',
  BASE: '16px',
  LG: '18px',
  XL: '20px',
  XL2: '24px',
  XL3: '30px',
  XL4: '36px',
  XL5: '48px',
};

/**
 * FONT WEIGHTS
 * Standard weight scale for typography hierarchy
 */
export const FONT_WEIGHTS = {
  NORMAL: 400,
  MEDIUM: 500,
  SEMIBOLD: 600,
  BOLD: 700,
};

/**
 * LINE HEIGHTS
 * Optimal line heights for different use cases
 */
export const LINE_HEIGHTS = {
  NONE: 1,
  TIGHT: 1.25,
  SNUG: 1.375,
  NORMAL: 1.5,
  RELAXED: 1.625,
  LOOSE: 2,
};

/**
 * FONT FAMILIES
 * System font stack for optimal performance
 */
export const FONT_FAMILIES = {
  SYSTEM: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  MONOSPACE: '"SF Mono", "Monaco", "Inconsolata", "Roboto Mono", "Source Code Pro", monospace',
};

// =============================================================================
// SPACING SYSTEM
// =============================================================================

/**
 * SPACING SCALE - MATHEMATICAL RHYTHM SYSTEM
 * 
 * A comprehensive spacing system built on mathematical principles to create
 * consistent visual rhythm and hierarchy throughout the interface. This system
 * eliminates arbitrary spacing decisions and ensures harmonious relationships.
 * 
 * MATHEMATICAL FOUNDATION:
 * - Base Unit: 4px - chosen for divisibility by common screen pixel densities
 * - Grid System: All measurements align to 4px grid for pixel-perfect rendering
 * - Proportional Relationships: Each step maintains mathematical consistency
 * - Accessibility Compliance: Larger values meet minimum touch target requirements
 * 
 * SCALE BENEFITS:
 * - Visual Consistency: Creates professional, cohesive appearance
 * - Decision Reduction: Limited, purposeful options reduce design fatigue
 * - Responsive Harmony: Proportional relationships scale across screen sizes
 * - Development Efficiency: Predefined scale accelerates implementation
 * 
 * USAGE CATEGORIES:
 * - PX to 1.5 (1px-6px): Borders, fine details, minimal adjustments
 * - 2 to 4 (8px-16px): Component padding, small gaps, tight spacing
 * - 5 to 8 (20px-32px): Standard component spacing, moderate gaps
 * - 9 to 16 (36px-64px): Section spacing, major layout gaps
 * - 18 to 24 (72px-96px): Page-level spacing, hero sections
 */
export const SPACING = {
  PX: '1px',
  '0_5': '2px',
  '1': '4px',
  '1_5': '6px',
  '2': '8px',
  '2_5': '10px',
  '3': '12px',
  '3_5': '14px',
  '4': '16px',
  '5': '20px',
  '6': '24px',
  '7': '28px',
  '8': '32px',
  '9': '36px',
  '10': '40px',
  '11': '44px',
  '12': '48px',
  '14': '56px',
  '16': '64px',
  '18': '72px',
  '20': '80px',
  '24': '96px',
};

// =============================================================================
// DIMENSIONS
// =============================================================================

/**
 * COMPONENT DIMENSIONS - SYSTEMATIC SIZING STANDARDS
 * 
 * Standardized dimensional values that ensure consistent component sizing
 * across the application. These dimensions are optimized for usability,
 * accessibility, and visual harmony.
 * 
 * DIMENSION CATEGORIES:
 * - Navigation: Fixed heights and widths for navigation elements
 * - Interactive Elements: Button heights and minimum widths for usability
 * - Form Controls: Input heights and spacing for form consistency
 * - Layout Containers: Maximum widths and structural dimensions
 * - Accessibility: Minimum touch targets and interaction areas
 * 
 * ACCESSIBILITY COMPLIANCE:
 * - Touch Targets: All interactive elements meet 44px minimum requirement
 * - Visual Hierarchy: Size differentials create clear functional relationships
 * - Responsive Behavior: Dimensions adapt appropriately across viewport sizes
 * - Motor Accessibility: Generous target areas for users with motor impairments
 * 
 * FILE SIZE MANAGEMENT:
 * - Reasonable Limits: File size restrictions prevent memory exhaustion
 * - User Experience: Limits balanced with practical file handling needs
 * - Performance: Size constraints ensure responsive application behavior
 */
export const DIMENSIONS = {
  // Navigation
  NAV_HEIGHT: '64px',
  
  // Buttons
  BUTTON_HEIGHT_SM: '32px',
  BUTTON_HEIGHT_MD: '36px',
  BUTTON_HEIGHT_LG: '44px',
  BUTTON_MIN_WIDTH: '36px',
  
  // Inputs
  INPUT_HEIGHT: '36px',
  
  // Layout
  SIDEBAR_WIDTH: '280px',
  CONTENT_MAX_WIDTH: '1200px',
  
  // Touch targets (minimum for accessibility)
  TOUCH_TARGET_MIN: '44px',
  
  // File size limits
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
};

// =============================================================================
// BORDER RADIUS
// =============================================================================

/**
 * BORDER RADIUS SYSTEM
 * Consistent corner rounding for components
 */
export const BORDER_RADIUS = {
  NONE: '0px',
  SM: '2px',
  DEFAULT: '4px',
  MD: '6px',
  LG: '8px',
  XL: '12px',
  XL2: '16px',
  XL3: '24px',
  FULL: '9999px',
};

// =============================================================================
// SHADOWS
// =============================================================================

/**
 * SHADOW SYSTEM
 * Elevation system for creating depth
 */
export const SHADOWS = {
  XS: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  SM: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  DEFAULT: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  MD: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
  LG: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  XL: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  
  // Theme-specific shadows
  DARK: {
    DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.3)',
    LG: '0 10px 25px rgba(0, 0, 0, 0.5)',
    FOCUS: '0 0 0 4px rgba(115, 115, 115, 0.3)',
  },
  
  LIGHT: {
    DEFAULT: '0 1px 3px rgba(0, 0, 0, 0.1)',
    LG: '0 10px 25px rgba(0, 0, 0, 0.15)',
    FOCUS: '0 0 0 4px rgba(115, 115, 115, 0.2)',
  }
};

// =============================================================================
// ANIMATION & TIMING
// =============================================================================

/**
 * ANIMATION DURATIONS
 * Standard timing for smooth animations
 */
export const DURATIONS = {
  INSTANT: '0ms',
  FAST: '150ms',
  NORMAL: '300ms',
  SLOW: '500ms',
  SLOWER: '1000ms',
};

/**
 * EASING FUNCTIONS
 * Consistent easing curves for natural motion
 */
export const EASINGS = {
  LINEAR: 'linear',
  EASE: 'ease',
  EASE_IN: 'ease-in',
  EASE_OUT: 'ease-out',
  EASE_IN_OUT: 'ease-in-out',
  CUBIC_BEZIER: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

/**
 * TRANSITION PRESETS
 * Common transition combinations
 */
export const TRANSITIONS = {
  FAST: `${DURATIONS.FAST} ${EASINGS.CUBIC_BEZIER}`,
  NORMAL: `${DURATIONS.NORMAL} ${EASINGS.CUBIC_BEZIER}`,
  SLOW: `${DURATIONS.SLOW} ${EASINGS.CUBIC_BEZIER}`,
  
  // Property-specific transitions
  BACKGROUND: `background-color ${DURATIONS.FAST} ${EASINGS.CUBIC_BEZIER}`,
  BORDER: `border-color ${DURATIONS.FAST} ${EASINGS.CUBIC_BEZIER}`,
  COLOR: `color ${DURATIONS.NORMAL} ${EASINGS.CUBIC_BEZIER}`,
  OPACITY: `opacity ${DURATIONS.NORMAL} ${EASINGS.CUBIC_BEZIER}`,
  TRANSFORM: `transform ${DURATIONS.NORMAL} ${EASINGS.CUBIC_BEZIER}`,
};

// =============================================================================
// Z-INDEX SYSTEM
// =============================================================================

/**
 * Z-INDEX LAYERS
 * Consistent layering system for proper stacking
 */
export const Z_INDEX = {
  DROPDOWN: 10,
  STICKY: 20,
  FIXED: 30,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  POPOVER: 60,
  TOOLTIP: 70,
  TOAST: 80,
  NAVBAR: 1000,
  SKIP_LINK: 10000,
};

// =============================================================================
// BREAKPOINTS
// =============================================================================

/**
 * RESPONSIVE BREAKPOINTS
 * Screen size breakpoints for responsive design
 */
export const BREAKPOINTS = {
  XS: '480px',
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  XL2: '1536px',
};

// =============================================================================
// COMPONENT-SPECIFIC CONSTANTS
// =============================================================================

/**
 * LOADING INDICATORS
 */
export const LOADING = {
  SPINNER_SIZE: '24px',
  PROGRESS_HEIGHT: '4px',
  DEBOUNCE_SEARCH: 300, // milliseconds
};

/**
 * TOAST NOTIFICATIONS
 */
export const TOAST = {
  DURATION_SHORT: 3000, // milliseconds
  DURATION_LONG: 5000,  // milliseconds
  MAX_TOASTS: 5,
};

/**
 * TABLE SYSTEM
 */
export const TABLE = {
  CELL_PADDING: SPACING[3],
  HEADER_HEIGHT: '44px',
  ROW_HEIGHT: '40px',
  BORDER_WIDTH: '1px',
};

/**
 * SEARCH SYSTEM
 */
export const SEARCH = {
  DEBOUNCE_DELAY: 300, // milliseconds
  MAX_RESULTS: 100,
  HIGHLIGHT_CLASS: 'search-highlight',
};

// =============================================================================
// ACCESSIBILITY
// =============================================================================

/**
 * ACCESSIBILITY CONSTANTS
 * Constants for meeting accessibility requirements
 */
export const A11Y = {
  // Minimum contrast ratios
  CONTRAST_AA: 4.5,
  CONTRAST_AAA: 7,
  
  // Focus indicator size
  FOCUS_RING_WIDTH: '2px',
  FOCUS_RING_OFFSET: '2px',
  
  // Screen reader text
  SR_ONLY_STYLES: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  },
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Generate CSS custom property name
 * @param {string} name - Property name
 * @returns {string} CSS custom property
 */
export const cssVar = (name) => `var(--${name})`;

/**
 * Generate CSS custom property declaration
 * @param {string} name - Property name
 * @param {string} value - Property value
 * @returns {string} CSS custom property declaration
 */
export const cssVarDeclaration = (name, value) => `--${name}: ${value};`;

/**
 * Get spacing value by key
 * @param {string} key - Spacing key
 * @returns {string} Spacing value
 */
export const getSpacing = (key) => SPACING[key] || SPACING['4'];

/**
 * Get font size by key
 * @param {string} key - Font size key
 * @returns {string} Font size value
 */
export const getFontSize = (key) => FONT_SIZES[key] || FONT_SIZES.BASE;

/**
 * Get color by theme and key
 * @param {string} theme - Theme name (DARK or LIGHT)
 * @param {string} key - Color key
 * @returns {string} Color value
 */
export const getThemeColor = (theme, key) => THEME_COLORS[theme]?.[key] || COLORS.BLACK;

// =============================================================================
// EXPORT DEFAULT
// =============================================================================

/**
 * Default export containing all constants
 */
export default {
  COLORS,
  THEME_COLORS,
  FONT_SIZES,
  FONT_WEIGHTS,
  LINE_HEIGHTS,
  FONT_FAMILIES,
  SPACING,
  DIMENSIONS,
  BORDER_RADIUS,
  SHADOWS,
  DURATIONS,
  EASINGS,
  TRANSITIONS,
  Z_INDEX,
  BREAKPOINTS,
  LOADING,
  TOAST,
  TABLE,
  SEARCH,
  A11Y,
  // Utility functions
  cssVar,
  cssVarDeclaration,
  getSpacing,
  getFontSize,
  getThemeColor,
};