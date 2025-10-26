# How to Commit Your Changes

Due to a terminal pager issue, please run these commands manually in a **fresh PowerShell or Git Bash window**:

## Commit 1: Enhanced Email Auth Flow

```powershell
cd "c:\Users\Peter Lim M L\Documents\Imperial\npm\onairos"

# Stage the file
git add src/onairosButton.jsx

# Commit with the prepared message
git commit -F COMMIT_MESSAGE.txt

# Verify the commit
git log -1 --stat
```

## Commit 2: API Response Logging

```powershell
# Stage the new files
git add src/utils/apiResponseLogger.js
git add src/components/DataRequest.js

# Commit with the prepared message
git commit -F COMMIT_MESSAGE_API_LOGGING.txt

# Verify the commit
git log -1 --stat
```

## Option 2: Using Git Bash

```bash
cd "/c/Users/Peter Lim M L/Documents/Imperial/npm/onairos"

# Stage the file
git add src/onairosButton.jsx

# Commit with the prepared message
git commit -F COMMIT_MESSAGE.txt

# Verify the commit
git log -1 --stat
```

## What Changed in onairosButton.jsx:

✅ **Enhanced email auth flow** with new/existing user detection  
✅ **Test mode improvements** - always starts fresh  
✅ **Session management** - resets on open/close  
✅ **Training integration** - auto-queues training jobs  
✅ **Flow routing** - new users → onboarding, existing → data request  

## After Committing:

You can push to your branch with:
```bash
git push origin main
# or
git push origin <your-branch-name>
```

---

**Note:** The commit message is already prepared in `COMMIT_MESSAGE.txt` with full details of all changes.

