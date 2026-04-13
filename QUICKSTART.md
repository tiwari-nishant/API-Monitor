# Quick Start Guide - API Network Monitor

Get up and running in 5 minutes!

## 🚀 Installation (2 minutes)

1. **Open Firefox**
   ```
   Type: about:debugging
   ```

2. **Load Extension**
   - Click "This Firefox" (left sidebar)
   - Click "Load Temporary Add-on"
   - Navigate to extension folder
   - Select `manifest.json`
   - Click "Open"

3. **Open Sidebar**
   - Click extension icon in toolbar
   - Sidebar opens on the right

✅ **You're ready!**

## 📝 Basic Usage (3 minutes)

### Step 1: Start Recording
```
Click the green "Start Recording" button
→ Button turns orange
→ Red dot appears in toolbar icon
```

### Step 2: View Details
```
Click any request in the list
→ Details panel slides in
→ See headers, body, response
```

### Step 4: Filter Results
```
Type in search box: "posts"
→ Only matching requests shown

Select filter: "REST"
→ Only REST API calls shown
```

### Step 5: Export Data
```
Click "JSON" or "CSV" button
→ Choose save location
→ File downloads
```

### Step 6: Stop 
```
Click "Stop Recording"
→ Recording stops


## 🎯 Common Tasks

### Monitor a Specific API
1. Start recording
2. Use search: type API domain
3. Filter by type if needed
4. Export when done

### Debug API Issues
1. Start recording
2. Reproduce the issue
3. Check failed requests (red border)
4. View error details
5. Export for sharing

### Compare API Calls
1. Record first scenario
2. Export as JSON
3. Clear data
4. Record second scenario
5. Export as JSON
6. Compare files

### Track Performance
1. Start recording
2. Load your application
3. Check "Avg Duration" stat
4. Sort by duration (click request)
5. Identify slow endpoints

## 💡 Pro Tips

### Keyboard Shortcuts
- **Ctrl+F** (in sidebar): Focus search
- **Esc**: Close details panel
- **Ctrl+Shift+J**: Open browser console (for debugging)

### Best Practices
- ✅ Clear data regularly to maintain performance
- ✅ Use filters to focus on relevant requests
- ✅ Export before clearing if you need the data
- ✅ Stop recording when not needed to save resources

### Troubleshooting
- **No requests?** → Check recording is started (orange button)
- **Missing details?** → Some responses blocked by CORS
- **Slow performance?** → Clear old data, reduce max requests
- **Sidebar won't open?** → Restart Firefox

## 📚 Learn More

- **Full Documentation**: [README.md](README.md)
- **Installation Guide**: [INSTALLATION.md](INSTALLATION.md)
- **Testing Guide**: [TESTING.md](TESTING.md)
- **Technical Details**: [TECHNICAL_PLAN.md](TECHNICAL_PLAN.md)

## 🆘 Need Help?

1. Check the [README.md](README.md) FAQ section
2. Review [TESTING.md](TESTING.md) for common issues
3. Open an issue on GitHub
4. Contact support

## 🎉 You're All Set!

Start monitoring your APIs and happy debugging!

---