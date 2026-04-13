# API Network Monitor - Firefox Extension

A powerful Firefox extension that monitors, captures, and exports all API calls visible in the browser's network activity. Features real-time monitoring with support for REST APIs and WebSocket connections.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Firefox](https://img.shields.io/badge/Firefox-78%2B-orange)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Functionality
- ✅ **Start/Stop Recording** - Control when to capture network requests
- ✅ **Real-time Monitoring** - Live updates of captured requests in sidebar
- ✅ **Comprehensive Capture** - URLs, methods, headers, payloads, responses, status codes, timestamps
- ✅ **Request Type Detection** - Automatic categorization (REST, WebSocket, Static)
- ✅ **Export Capabilities** - Download captured data as JSON
- ✅ **Advanced Filtering** - Search by URL, filter by type or status code
- ✅ **Request Details View** - Inspect full request/response information
- ✅ **Statistics Dashboard** - Real-time metrics and request counts
- ✅ **Performance Optimized** - Handles large volumes without degradation

### Supported API Types
- **REST APIs** - Standard HTTP requests with JSON/XML
- **WebSocket** - Real-time connection monitoring
- **Static Assets** - CSS, JS, images, fonts, etc.

## 📸 Screenshots

### Sidebar Interface
The extension provides a persistent sidebar with:
- Control buttons (Start/Stop/Clear/Export)
- Real-time statistics dashboard
- Filter and search controls
- Scrollable request list with color-coded status
- Detailed request/response viewer

## 🚀 Installation

### Development Installation (Temporary)

1. **Clone or download this repository**
   ```bash
   git clone <repository-url>
   cd network-api-monitor
   ```

2. **Generate PNG icons** (optional, SVG works too)
   - Open `icons/create-icons.html` in a browser
   - Download the generated PNG files
   - Or use the SVG icons directly

3. **Load in Firefox**
   - Open Firefox
   - Navigate to `about:debugging`
   - Click "This Firefox"
   - Click "Load Temporary Add-on"
   - Select the `manifest.json` file from the project directory

4. **Open the sidebar**
   - Click the extension icon in the toolbar, or
   - Use the keyboard shortcut (if configured), or
   - Go to View > Sidebar > API Network Monitor

### Production Installation (From Firefox Add-ons)

*Coming soon - Extension will be published to Firefox Add-ons (AMO)*

## 📖 Usage Guide

### Basic Workflow

1. **Open the Sidebar**
   - Click the extension icon in Firefox toolbar
   - The sidebar will open on the right side

2. **Start Recording**
   - Click the "Start Recording" button
   - The button will turn orange and show "Stop Recording"
   - A red recording indicator appears in the toolbar icon

3. **Browse and Capture**
   - Navigate to any website
   - All network requests will be captured automatically
   - Watch the statistics update in real-time

4. **View Request Details**
   - Click any request in the list
   - A detailed panel slides in showing:
     - General information (URL, method, status, duration)
     - Request headers and body
     - Response headers and body

5. **Filter and Search**
   - Use the search box to find specific URLs
   - Filter by method type (GET,POST,PUT,DELETE)
   - Filter by status code range (2xx, 3xx, 4xx, 5xx)

6. **Export Data**
   - Click "JSON" to export as JSON format
   - Click "CSV" to export as CSV format
   - Choose save location in the download dialog

7. **Stop Recording**
   - Click "Stop Recording" when done
   - Data remains available for review and export

8. **Clear Data**
   - Click "Clear" to remove all captured requests
   - Confirmation dialog prevents accidental deletion

### Advanced Features

#### Request Type Detection
The extension automatically detects and categorizes:
- **METHOD**: Standard REST Methods

#### Statistics Dashboard
Real-time metrics include:
- Total requests captured
- Status code distribution

#### Performance Optimization
- Circular buffer limits storage to 1000 requests (configurable)
- Lazy loading of request details
- Efficient filtering and search
- Minimal memory footprint

## 🔧 Configuration

### Removing Redfish URL Filter

By default, the extension only captures requests containing `/redfish/` in the URL path. To capture all network requests:

1. **Open the request interceptor file**
   - Navigate to `background/request-interceptor.js`

2. **Locate the `shouldCaptureUrl()` method** (around line 20-40)

3. **Comment out or remove the Redfish filter**:
   ```javascript
   shouldCaptureUrl(url) {
     // Exclude node_modules
     if (url.includes('/node_modules/')) {
       return false;
     }
     
     // Exclude src/views
     if (url.includes('/src/views/')) {
       return false;
     }
     
     // COMMENT OUT OR REMOVE THIS SECTION TO CAPTURE ALL REQUESTS:
     /*
     // Only capture Redfish API calls (contains /redfish/ in the path)
     if (url.toLowerCase().includes('/redfish/')) {
       return true;
     }
     
     // Exclude everything else
     return false;
     */
     
     // INSTEAD, RETURN TRUE TO CAPTURE ALL (except excluded above):
     return true;
   }
   ```

4. **Reload the extension**
   - Go to `about:debugging`
   - Click "Reload" next to the extension
   - Or restart Firefox

5. **Alternative: Custom URL Pattern**
   
   To capture specific URL patterns instead:
   ```javascript
   shouldCaptureUrl(url) {
     // Exclude node_modules and src/views
     if (url.includes('/node_modules/') || url.includes('/src/views/')) {
       return false;
     }
     
     // Capture only API calls (customize as needed)
     if (url.includes('/api/') ||
         url.includes('/v1/') ||
         url.includes('/graphql')) {
       return true;
     }
     
     return false;
   }
   ```

### Domain Filtering (stglabs)

The extension currently only captures requests when the active tab URL contains 'stglabs'. To remove this restriction:

1. **Open the request interceptor file**
   - Navigate to `background/request-interceptor.js`

2. **Locate the `handleBeforeRequest()` method** (around line 180-210)

3. **Comment out the stglabs check**:
   ```javascript
   // COMMENT OUT THIS SECTION:
   /*
   // Only capture if active tab URL contains 'stglabs'
   if (!this.isStglabsTab()) {
     console.log('Ignoring request - active tab is not a stglabs domain:', this.activeTabUrl);
     return;
   }
   */
   ```

4. **Reload the extension** as described above

### Storage Limits
By default, the extension stores up to 1000 requests. To change this:

```javascript
// In browser console or background script
browser.runtime.sendMessage({
  type: 'SET_MAX_REQUESTS',
  maxRequests: 2000
});
```

### Auto-start Recording
To automatically start recording when Firefox opens:

```javascript
// Set in browser storage
browser.storage.local.set({ autoStart: true });
```

## 📊 Export Formats

### JSON Export
```json
{
  "exportDate": "2026-03-31T03:37:00.000Z",
  "totalRequests": 150,
  "statistics": {
    "total": 150,
    "byType": { "REST": 130, "WebSocket": 20 },
    "avgDuration": 245
  },
  "requests": [
    {
      "id": "req_001",
      "timestamp": 1743394620000,
      "date": "2026-03-31T03:37:00.000Z",
      "url": "https://api.example.com/users",
      "method": "GET",
      "type": "REST",
      "status": 200,
      "duration": 245,
      "requestHeaders": {...},
      "responseHeaders": {...},
      "requestBody": "...",
      "responseBody": "..."
    }
  ]
}
```

### CSV Export
Flattened format with columns:
- ID, Timestamp, Date, URL, Method, Type, Status, Duration
- Request Headers, Response Headers
- Request Body, Response Body

## 🛠️ Development

### Project Structure
```
network-api-monitor/
├── manifest.json              # Extension configuration
├── background/
│   ├── background.js         # Main coordinator
│   ├── request-interceptor.js # Network capture
│   └── storage-manager.js    # Data management
├── sidebar/
│   ├── sidebar.html          # UI structure
│   ├── sidebar.js            # UI logic
│   └── sidebar.css           # Styling
├── utils/
│   ├── request-parser.js     # Type detection
│   └── filters.js            # Filtering logic
├── icons/                    # Extension icons
└── README.md                 # This file
```

### Technologies Used
- **Firefox WebExtensions API** - Native browser integration
- **webRequest API** - Network request interception
- **browser.storage.local** - Data persistence
- **Vanilla JavaScript** - No framework dependencies
- **CSS3** - Modern, responsive styling

### Building from Source

1. Clone the repository
2. No build step required - pure JavaScript
3. Load in Firefox as temporary add-on
4. For production, package as `.xpi` file

### Testing

Test with various websites:
- **REST APIs**: GitHub API, JSONPlaceholder
- **WebSocket**: Socket.io demos, trading platforms
- **Mixed**: Modern web applications

## 🔒 Privacy & Security

- ✅ All data stored locally in browser
- ✅ No external data transmission
- ✅ No analytics or tracking
- ✅ Minimal required permissions
- ✅ Content sanitization to prevent XSS
- ✅ HTTPS metadata only (no decryption)

## 📝 Permissions Explained

The extension requires these permissions:

- **webRequest** - To intercept and monitor network requests
- **webRequestBlocking** - To capture request/response data
- **storage** - To persist captured data locally
- **tabs** - To identify which tab made each request
- **downloads** - To export data as JSON/CSV files
- **<all_urls>** - To monitor requests from any website

## 🐛 Troubleshooting

### Extension not capturing requests
- Ensure recording is started (green button should be orange)
- Check that the website is making network requests
- Try refreshing the page after starting recording

### Response bodies not captured
- Some responses cannot be captured due to CORS restrictions
- Binary content (images, videos) is not captured
- Very large responses (>1MB) are truncated

### Sidebar not opening
- Check if sidebar is enabled in Firefox settings
- Try clicking the toolbar icon
- Restart Firefox if needed

### Performance issues
- Reduce max requests limit if capturing too many
- Clear old data regularly
- Filter to show only relevant request types

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Firefox WebExtensions documentation
- Mozilla Developer Network (MDN)
- Open source community

## 📞 Support

- **Issues**: Report bugs on GitHub Issues
- **Questions**: Use GitHub Discussions
- **Email**: [Your contact email]

## 🗺️ Roadmap

Future enhancements planned:
- [ ] Request replay functionality
- [ ] HAR (HTTP Archive) format export
- [ ] Request comparison and diff view
- [ ] Custom filtering rules
- [ ] Performance waterfall view
- [ ] Dark/Light theme toggle
- [ ] Request mocking
- [ ] Automated test generation
- [ ] Chrome/Edge compatibility

## 📊 Version History

### v1.0.0 (2026-03-31)
- Initial release
- Core monitoring functionality
- REST, WebSocket support
- JSON export
- Sidebar interface
- Filtering and search
- Request details view
- Statistics dashboard

---

**Made with ❤️ for developers who need to monitor API calls**