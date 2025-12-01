# 🚀 Onairos Installation Guide - Tailwind CSS Compatibility

## Issue: Peer Dependency Error

If you're seeing this error:

```
npm error ERESOLVE unable to resolve dependency tree
npm error Could not resolve dependency:
npm error peer tailwindcss@"^4.1.11" from onairos@4.0.1
```

**✅ SOLUTION: This is now FIXED in v4.0.16+**

---

## Quick Installation (Works with Tailwind v3 & v4)

```bash
npm install onairos@latest
```

That's it! Onairos now supports **both Tailwind CSS v3.0+ and v4.0+** out of the box.

---

## For Developers with Tailwind v3 (Brandon's Issue)

### Your Current Setup
```json
{
  "devDependencies": {
    "tailwindcss": "^3.4.18"
  }
}
```

### Installation Steps

**Option 1: Direct Install (Recommended)**
```bash
npm install onairos@latest
```

**Option 2: If you still get warnings**
```bash
npm install onairos@latest --legacy-peer-deps
```

**Option 3: Using .npmrc (Permanent fix)**
Create `.npmrc` in your project root:
```
legacy-peer-deps=true
```
Then run:
```bash
npm install onairos@latest
```

### ✅ No Configuration Changes Needed!

Onairos automatically works with your existing Tailwind v3 setup. Keep your current:
- `tailwind.config.js`
- `postcss.config.js`
- CSS imports (`@tailwind base; @tailwind components; @tailwind utilities;`)

### Verify Installation
```bash
npm list onairos
# Should show: onairos@4.0.16 or higher

npm list tailwindcss
# Should show: tailwindcss@3.4.18 (or your version)
```

### Use Onairos in Your App
```javascript
import { OnairosButton } from 'onairos';

function App() {
  return (
    <OnairosButton
      apiKey="your-api-key"
      onSuccess={(data) => console.log('User data:', data)}
      onError={(error) => console.error('Error:', error)}
    />
  );
}
```

---

## For Developers with Tailwind v4

### Your Current Setup
```json
{
  "devDependencies": {
    "tailwindcss": "^4.1.11",
    "@tailwindcss/postcss": "^4.1.11"
  }
}
```

### Installation Steps
```bash
npm install onairos@latest
```

### ✅ No Configuration Changes Needed!

Onairos works automatically with Tailwind v4. Keep your current:
- `postcss.config.js` with `@tailwindcss/postcss`
- CSS imports (`@import "tailwindcss";`)

---

## Upgrading from Tailwind v3 to v4 (Optional)

If you want to upgrade to Tailwind v4 for better performance:

### Step 1: Remove Old Packages
```bash
npm uninstall tailwindcss autoprefixer
```

### Step 2: Install Tailwind v4
```bash
npm install -D tailwindcss@^4.1.11 @tailwindcss/postcss@^4.1.11
```

### Step 3: Update postcss.config.js

**Before (v3):**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

**After (v4):**
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### Step 4: Update CSS File

**Before (v3):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**After (v4):**
```css
@import "tailwindcss";
```

### Step 5: Test Your Build
```bash
npm run build
npm start
```

---

## Comparison: Keep v3 vs Upgrade to v4

| Factor | Keep Tailwind v3 | Upgrade to Tailwind v4 |
|--------|------------------|------------------------|
| **Installation** | No changes needed | Update config files |
| **Onairos Compatibility** | ✅ Works | ✅ Works |
| **Build Speed** | Standard | ~2x faster |
| **Bundle Size** | Normal | ~20% smaller |
| **Effort Required** | 0 minutes | ~10 minutes |
| **Risk** | None | Low (config changes) |
| **Best For** | Existing projects | New projects |

---

## Troubleshooting

### Error: "Cannot find module 'tailwindcss'"
You need to install Tailwind CSS first:

**For v3:**
```bash
npm install -D tailwindcss@^3.4.18 postcss autoprefixer
npx tailwindcss init -p
```

**For v4:**
```bash
npm install -D tailwindcss@^4.1.11 @tailwindcss/postcss@^4.1.11
```

### Error: "Module not found: Can't resolve 'onairos'"
```bash
npm install onairos@latest
```

### Onairos Styles Not Showing
Make sure you're importing Onairos properly:

```javascript
// The component automatically includes styles
import { OnairosButton } from 'onairos';
```

### Still Getting Peer Dependency Errors?

**1. Clear npm cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**2. Use --legacy-peer-deps:**
```bash
npm install onairos@latest --legacy-peer-deps
```

**3. Update npm:**
```bash
npm install -g npm@latest
```

---

## What Changed in v4.0.16?

### Fixed
- ✅ **Backward compatibility** with Tailwind CSS v3.0+
- ✅ Peer dependency now accepts: `"tailwindcss": ">=3.0.0"`
- ✅ Works with Tailwind v3.4.18 (Brandon's version)
- ✅ Works with Tailwind v4.1.11
- ✅ No breaking changes for existing users

### Technical Details
- Updated `peerDependencies` in package.json
- Automatic version detection (no user action needed)
- Styles compatible with both major versions

---

## For Brandon (The Developer With the Error)

### What You Need to Do

**1. Update Onairos to the latest version:**
```bash
npm install onairos@latest
```

**2. That's it!** No need to change anything else.

Your current Tailwind v3.4.18 setup will work perfectly with Onairos v4.0.16+.

### Before vs After

**Before (v4.0.1-4.0.15):**
- ❌ Required Tailwind v4
- ❌ Got peer dependency errors with v3
- ❌ Had to use `--force` or `--legacy-peer-deps`

**After (v4.0.16+):**
- ✅ Works with Tailwind v3 and v4
- ✅ No peer dependency errors
- ✅ No workarounds needed

---

## Support

- 📚 [Full Documentation](https://onairos.uk)
- 🐛 [Report Issues](https://github.com/zd819/OnairosNPM/issues)
- 💬 [Discussions](https://github.com/zd819/OnairosNPM/discussions)

---

**Package Version:** 4.0.16+  
**Tailwind Support:** v3.0+ and v4.0+  
**Last Updated:** December 1, 2025

