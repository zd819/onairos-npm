# Tailwind CSS v4.1.11 Upgrade Guide

## Overview

The Onairos SDK has been successfully upgraded to Tailwind CSS v4.1.11, bringing significant performance improvements and modern CSS features.

## Key Improvements

### 🚀 Performance Gains
- **3.5x faster** full builds
- **8x faster** incremental builds with new CSS
- **100x faster** incremental builds with no new CSS (measured in microseconds!)

### 🎨 New Features
- **Text Shadows**: New `text-shadow-*` utilities with color support
- **Mask Utilities**: Composable `mask-*` utilities for complex effects
- **Container Queries**: Built-in `@container` and responsive variants
- **3D Transforms**: Native `rotate-x-*`, `rotate-y-*`, `scale-z-*` utilities
- **Enhanced Gradients**: Angle support, conic/radial gradients, color interpolation
- **Dynamic Utilities**: No configuration needed for arbitrary grid columns, spacing values
- **Safe Alignment**: `justify-center-safe` prevents content from being clipped

## Configuration Changes

### Old Configuration (v3)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'onairos-primary': '#3B82F6'
      }
    }
  }
}
```

### New Configuration (v4)
```css
/* src/styles/tailwind.css */
@import "tailwindcss";

@theme {
  --color-onairos-primary: #3B82F6;
  --color-onairos-secondary: #1E40AF;
  --color-onairos-accent: #06B6D4;
}
```

## Build Configuration

### PostCSS Setup
```javascript
// postcss.config.js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

### Webpack Integration
The webpack configuration has been updated to:
- Process CSS files with PostCSS and Tailwind v4
- Extract CSS into separate files for production
- Support both development and production builds

## Custom Utilities

New custom utilities have been created for the Onairos SDK:

```css
@utility btn-onairos {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 600;
  transition: all 0.2s ease-in-out;
  background-color: var(--color-onairos-primary);
  color: white;
}

@utility card-onairos {
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  padding: 1.5rem;
  border: 1px solid rgb(229 231 235);
}

@utility loading-spinner {
  /* Animated loading spinner */
}
```

## Migration Changes Made

### Updated Gradient Classes
- `bg-gradient-to-r` → `bg-linear-to-r`
- `bg-gradient-to-tr` → `bg-linear-to-tr`
- `bg-gradient-to-br` → `bg-linear-to-br`

### Package Dependencies
- Updated `tailwindcss` from `^3.3.5` to `^4.1.11`
- Added `@tailwindcss/postcss` for v4 PostCSS integration
- Added CSS processing dependencies (`css-loader`, `style-loader`, `postcss-loader`)
- Added `mini-css-extract-plugin` for production CSS extraction

## New Features Examples

### Container Queries
```html
<div class="@container">
  <div class="grid grid-cols-1 @sm:grid-cols-3 @lg:grid-cols-4">
    <!-- Responsive based on container, not viewport -->
  </div>
</div>
```

### Text Shadows
```html
<h1 class="text-shadow-lg text-shadow-blue-500/50">
  Colored text shadow
</h1>
```

### Dynamic Grid Columns
```html
<!-- No configuration needed -->
<div class="grid grid-cols-7 gap-2">
  <!-- 7 columns just work -->
</div>
```

### 3D Transforms
```html
<div class="perspective-distant">
  <div class="rotate-x-45 rotate-y-30 transform-3d">
    3D transformed element
  </div>
</div>
```

### Enhanced Gradients
```html
<!-- 45-degree linear gradient -->
<div class="bg-linear-45 from-pink-500 to-orange-500"></div>

<!-- Radial gradient with position -->
<div class="bg-radial-[at_30%_30%] from-cyan-500 to-blue-600"></div>

<!-- Conic gradient -->
<div class="bg-conic from-red-500 via-yellow-500 to-blue-500"></div>
```

## CSS Variables Access

All theme values are now available as CSS variables:

```css
.custom-component {
  background-color: var(--color-onairos-primary);
  font-family: var(--font-display);
  border-radius: var(--spacing);
}
```

## Testing

A new test file `test-tailwind-v4.html` has been created to showcase all the new features and verify the upgrade works correctly.

## Building the Project

```bash
# Install dependencies
npm install

# Development build
npm run dev

# Production build
npm run build
```

## Browser Support

Tailwind CSS v4.1.11 requires:
- Safari 16.4+
- Chrome 111+
- Firefox 128+

For older browser support, consider staying with v3.4 or using a compatibility layer.

## Performance Benefits

The upgrade brings substantial performance improvements:
- Faster development builds
- Reduced CSS bundle size
- Better tree-shaking
- Modern CSS features that reduce JavaScript overhead

## Next Steps

1. Test all components thoroughly
2. Update any remaining v3 syntax
3. Explore new v4 features in component designs
4. Consider using CSS variables for runtime theming
5. Update documentation and examples

## Resources

- [Tailwind CSS v4.0 Documentation](https://tailwindcss.com/docs)
- [Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
- [New Features Blog Post](https://tailwindcss.com/blog/tailwindcss-v4) 