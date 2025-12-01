# Tailwind CSS Compatibility Guide for Onairos

## Problem
You're getting this error when installing `onairos`:
```
npm error Could not resolve dependency:
npm error peer tailwindcss@"^4.1.11" from onairos@4.0.5
```

This happens because `onairos@4.0.5` requires **Tailwind CSS v4**, but your project uses **Tailwind CSS v3**.

---

## ✅ SOLUTION A: Use Onairos v4.0.6+ (Backward Compatible)

**We've made Onairos backward compatible with Tailwind v3!**

### Installation
```bash
npm install onairos@latest
```

or with specific flags if needed:
```bash
npm install onairos@latest --legacy-peer-deps
```

### What Changed
- `onairos@4.0.6+` now supports **both Tailwind v3 and v4**
- Peer dependency updated to: `"tailwindcss": "^3.4.0 || ^4.0.0"`
- CSS automatically adapts based on your Tailwind version

### Requirements for Tailwind v3 Users
Make sure your project has:
```json
{
  "dependencies": {
    "tailwindcss": "^3.4.0"
  }
}
```

---

## 🚀 SOLUTION B: Upgrade to Tailwind CSS v4 (Recommended)

If you want the latest features and better performance, upgrade to Tailwind v4.

### Step 1: Update Dependencies

```bash
# Remove old Tailwind v3
npm uninstall tailwindcss autoprefixer

# Install Tailwind v4
npm install -D tailwindcss@^4.1.11 @tailwindcss/postcss@^4.1.11

# Install Onairos
npm install onairos@latest
```

### Step 2: Update PostCSS Config

**Before (postcss.config.js):**
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  }
}
```

**After (postcss.config.js):**
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
```

### Step 3: Update CSS File

**Before (src/index.css or src/App.css):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**After:**
```css
@import "tailwindcss";
```

### Step 4: Update Tailwind Config (Optional)

Tailwind v4 no longer requires `tailwind.config.js` for basic usage. You can use CSS-based configuration instead.

**If you need a config file**, create `tailwind.config.ts`:
```typescript
import type { Config } from 'tailwindcss'

export default {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
} satisfies Config
```

### Step 5: Test Your Application

```bash
npm run build
npm start
```

---

## 📋 Quick Comparison

| Feature | Solution A (v3 Compatible) | Solution B (v4 Upgrade) |
|---------|---------------------------|-------------------------|
| **Installation** | `npm install onairos@latest` | Update Tailwind first, then install |
| **Your Tailwind Version** | Keep v3.4+ | Upgrade to v4.1.11+ |
| **Breaking Changes** | None | PostCSS config, CSS imports |
| **Performance** | Standard | Improved (v4 benefits) |
| **New Features** | Limited to v3 | Full v4 features |
| **Recommended For** | Quick fix, stability | New projects, best performance |

---

## 🔧 Troubleshooting

### Still Getting Peer Dependency Errors?

**Option 1: Use --legacy-peer-deps**
```bash
npm install onairos --legacy-peer-deps
```

**Option 2: Use --force (not recommended)**
```bash
npm install onairos --force
```

**Option 3: Update npm**
```bash
npm install -g npm@latest
```

### Check Your Installed Version
```bash
npm list tailwindcss
npm list onairos
```

### Verify Onairos Works
```javascript
import { OnairosButton } from 'onairos';

function App() {
  return (
    <OnairosButton
      apiKey="your-api-key"
      onSuccess={(data) => console.log(data)}
    />
  );
}
```

---

## 📚 Additional Resources

- [Tailwind v4 Documentation](https://tailwindcss.com/docs/v4-beta)
- [Tailwind v3 to v4 Migration Guide](https://tailwindcss.com/docs/upgrade-guide)
- [Onairos Documentation](https://onairos.uk)

---

## Need Help?

- Open an issue: https://github.com/zd819/OnairosNPM/issues
- Check existing issues for similar problems
- Include your `package.json` and error logs

