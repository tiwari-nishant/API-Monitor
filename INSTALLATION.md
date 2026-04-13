# Installation Guide - API Network Monitor

## Quick Start (Development Mode)

### Prerequisites
- Firefox 78 or later
- No additional dependencies required

### Step-by-Step Installation

#### 1. Get the Extension Files
```bash
# If you have the source code
cd /path/to/network-api-monitor

# Or download/clone from repository
git clone <repository-url>
cd network-api-monitor
```

#### 2. Prepare Icons (Optional)
The extension includes SVG icons which work in Firefox. If you prefer PNG:

**Option A: Use the HTML generator**
```bash
# Open in browser
open icons/create-icons.html
# Click download links for each size
# Save as icon-16.png, icon-48.png, icon-96.png in icons/ directory
```

**Option B: Use Node.js generator**
```bash
cd icons
node generate-icons.js
# Then convert SVG to PNG using online tool or ImageMagick
```

**Option C: Skip this step**
Firefox supports SVG icons, so you can use the extension as-is.

#### 3. Load Extension in Firefox

1. **Open Firefox Developer Tools**
   - Type `about:debugging` in the address bar
   - Press Enter

2. **Navigate to This Firefox**
   - Click "This Firefox" in the left sidebar

3. **Load Temporary Add-on**
   - Click the "Load Temporary Add-on..." button
   - Navigate to your extension directory
   - Select the `manifest.json` file
   - Click "Open"

4. **Verify Installation**
   - You should see "API Network Monitor" in the list
   - The extension icon appears in the toolbar
   - Status shows "Running"

#### 4. Open the Sidebar

**Method 1: Click toolbar icon**
- Click the extension icon in Firefox toolbar
- Sidebar opens automatically

**Method 2: Firefox menu**
- Go to View > Sidebar
- Select "API Network Monitor"

**Method 3: Keyboard shortcut** (if configured)
- Press the configured shortcut key

#### 5. Start Using

1. Click "Start Recording" in the sidebar
2. Navigate to any website
3. Watch requests appear in real-time
4. Click any request to view details
5. Use filters to find specific requests
6. Export data as JSON or CSV when done

## Troubleshooting

### Extension doesn't load
- **Check manifest.json** - Ensure file is valid JSON
- **Check file paths** - All referenced files must exist
- **Check Firefox version** - Requires Firefox 78+
- **Check console** - Look for errors in Browser Console (Ctrl+Shift+J)

### Icons not showing
- **Use SVG icons** - Update manifest.json to use .svg extensions
- **Generate PNG** - Follow icon generation steps above
- **Check file paths** - Ensure icons exist in icons/ directory

### Sidebar doesn't open
- **Check permissions** - Ensure sidebar_action is in manifest
- **Restart Firefox** - Sometimes needed after first install
- **Check sidebar settings** - View > Sidebar menu

### No requests captured
- **Start recording** - Click "Start Recording" button
- **Refresh page** - Reload the website after starting
- **Check permissions** - Ensure webRequest permissions granted
- **Check filters** - Remove any active filters

### Performance issues
- **Clear old data** - Click "Clear" button regularly
- **Reduce max requests** - Lower the storage limit
- **Filter requests** - Show only relevant types
- **Close unused tabs** - Reduce overall browser load

## Development Mode Notes

### Temporary Add-on Limitations
- Extension is removed when Firefox closes
- Must reload after each Firefox restart
- Changes require "Reload" button click in about:debugging

### Making Changes
1. Edit source files
2. Go to `about:debugging`
3. Find your extension
4. Click "Reload" button
5. Changes take effect immediately

### Debugging
- **Browser Console**: Ctrl+Shift+J (Cmd+Shift+J on Mac)
- **Extension Console**: Click "Inspect" in about:debugging
- **Sidebar Console**: Right-click sidebar > Inspect

## Production Installation (Future)

Once published to Firefox Add-ons:

1. Visit Firefox Add-ons website
2. Search for "API Network Monitor"
3. Click "Add to Firefox"
4. Confirm installation
5. Extension installs permanently

## Uninstallation

### Temporary Add-on
- Go to `about:debugging`
- Find "API Network Monitor"
- Click "Remove"

### Permanent Add-on (Future)
- Go to `about:addons`
- Find "API Network Monitor"
- Click "Remove"
- Confirm removal

## Permissions Explained

When you install, Firefox will request these permissions:

| Permission | Purpose |
|------------|---------|
| `webRequest` | Monitor network requests |
| `webRequestBlocking` | Capture request/response data |
| `storage` | Save captured data locally |
| `tabs` | Identify which tab made requests |
| `downloads` | Export data as files |
| `<all_urls>` | Monitor requests from any website |

All permissions are necessary for core functionality. No data is sent externally.

## System Requirements

### Minimum
- Firefox 78 ESR or later
- 100 MB free RAM
- 10 MB free disk space

### Recommended
- Firefox 100 or later
- 500 MB free RAM
- 50 MB free disk space (for large captures)

## Platform Support

- ✅ Windows 10/11
- ✅ macOS 10.14+
- ✅ Linux (all major distributions)
- ✅ Firefox ESR

## Next Steps

After installation:
1. Read the [README.md](README.md) for usage guide
2. Check [TECHNICAL_PLAN.md](TECHNICAL_PLAN.md) for architecture details
3. Review [IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md) for code details

## Getting Help

- **Documentation**: See README.md
- **Issues**: Report on GitHub
- **Questions**: GitHub Discussions
- **Updates**: Check for new versions regularly

---

**Happy API Monitoring! 🚀**