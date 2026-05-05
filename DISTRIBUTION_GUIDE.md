,qqqqq# Distribution Guide - Firefox Extension

## Simple Distribution via GitHub

Yes! Users can directly clone your repository and load it into Firefox. This is the simplest distribution method.

---

## For Users: Installation from GitHub

### Method 1: Clone and Load (Recommended)

**Step 1: Clone the Repository**
```bash
git clone https://github.com/yourusername/your-repo.git
cd your-repo
```

**Step 2: Load in Firefox**

**On Windows:**
1. Open Firefox
2. Type `about:debugging` in the address bar
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the cloned folder
6. Select the `manifest.json` file
7. Done! Extension is now loaded

**On macOS:**
1. Open Firefox
2. Type `about:debugging` in the address bar
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the cloned folder
6. Select the `manifest.json` file
7. Done! Extension is now loaded

**Note:** This loads the extension temporarily. It will be removed when Firefox restarts.

### Method 2: Download ZIP and Load

**Step 1: Download**
1. Go to your GitHub repository
2. Click the green "Code" button
3. Click "Download ZIP"
4. Extract the ZIP file

**Step 2: Load in Firefox**
- Follow the same steps as Method 1, Step 2

---

## Limitations of Temporary Loading

### Pros:
- ✅ No signing required
- ✅ Works immediately
- ✅ Easy to update (just pull latest changes)
- ✅ Perfect for development and testing

### Cons:
- ❌ Extension is removed when Firefox restarts
- ❌ Must reload manually after each restart
- ❌ Not suitable for non-technical users

---

## For Permanent Installation

If you want users to have a permanent installation (survives Firefox restart), you have two options:

### Option 1: Firefox Add-ons (AMO) - Best for Public Distribution

**For Extension Developer:**
1. Create account at [addons.mozilla.org](https://addons.mozilla.org/developers/)
2. Package your extension as ZIP
3. Submit for review
4. Once approved, users can install with one click

**For Users:**
- Simply visit your AMO page and click "Add to Firefox"
- Extension updates automatically
- Works on Windows, Mac, and Linux

### Option 2: Self-Signed XPI - Best for Private Distribution

**For Extension Developer:**

1. **Install web-ext:**
   ```bash
   npm install -g web-ext
   ```

2. **Get API Credentials:**
   - Go to [AMO API Keys](https://addons.mozilla.org/developers/addon/api/key/)
   - Generate API key (JWT issuer and secret)

3. **Sign Your Extension:**
   ```bash
   cd your-extension-folder
   web-ext sign --api-key=YOUR_JWT_ISSUER --api-secret=YOUR_JWT_SECRET --channel=unlisted
   ```

4. **Share the XPI:**
   - This creates a signed `.xpi` file in `web-ext-artifacts/`
   - Upload to GitHub Releases
   - Share download link with users

**For Users:**
1. Download the `.xpi` file
2. Drag and drop it into Firefox
3. Click "Add" when prompted
4. Extension is permanently installed

---

## Recommended Approach for Your Use Case

### For Internal/Team Use:
```markdown
## Installation Instructions

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/your-repo.git
   ```

2. Open Firefox and go to `about:debugging`

3. Click "This Firefox" → "Load Temporary Add-on"

4. Select the `manifest.json` file from the cloned folder

5. The extension is now loaded!

**Note:** You'll need to reload the extension each time you restart Firefox.
To update, just `git pull` the latest changes and reload.
```

### For Public Distribution:
1. Publish on Firefox Add-ons (AMO)
2. Users install with one click
3. Automatic updates

### For Private Distribution (Non-Technical Users):
1. Create signed XPI file
2. Upload to GitHub Releases
3. Users download and install XPI

---

## Quick Setup for Your README

Add this to your README.md:

```markdown
## Installation

### For Developers/Testing

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/your-repo.git
   cd your-repo
   ```

2. Open Firefox and navigate to `about:debugging`

3. Click "This Firefox" → "Load Temporary Add-on"

4. Select the `manifest.json` file

### For End Users

[Coming Soon] Install from Firefox Add-ons: [Link]

Or download the latest release: [Releases](https://github.com/yourusername/your-repo/releases)

## Supported Platforms

- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Linux (all distributions)

## Updating

For temporary installation:
```bash
git pull origin main
```
Then reload the extension in `about:debugging`
```

---

## Summary

**Simplest Distribution (What You Asked About):**
- ✅ Users clone your GitHub repo
- ✅ Load via `about:debugging` → "Load Temporary Add-on"
- ✅ Works on Windows and Mac
- ✅ No signing or packaging needed
- ❌ Must reload after Firefox restart

**For Production Use:**
- Publish on Firefox Add-ons (AMO) for permanent installation
- Or create signed XPI for private distribution

---

## Need More Details?

- **Temporary Loading**: See [INSTALLATION.md](INSTALLATION.md)
- **AMO Publishing**: [Firefox Extension Workshop](https://extensionworkshop.com/)
- **Signing Extensions**: [web-ext Documentation](https://extensionworkshop.com/documentation/develop/web-ext-command-reference/)