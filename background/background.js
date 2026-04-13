/**
 * Background Script
 * Main coordinator for the API Network Monitor extension
 */

// Extension state
let isRecording = false;
let connectedPorts = new Set();

console.log('API Network Monitor background script loaded');

/**
 * Initialize extension
 */
async function initialize() {
  console.log('Initializing API Network Monitor...');
  
  // Initialize storage manager
  await StorageManager.init();
  
  // Check if we should auto-start recording
  const { autoStart } = await browser.storage.local.get('autoStart');
  if (autoStart) {
    startRecording();
  }
  
  console.log('API Network Monitor initialized');
}

/**
 * Start recording network requests
 */
function startRecording() {
  if (isRecording) {
    console.log('Already recording');
    return;
  }
  
  console.log('Starting recording...');
  
  // Clear any existing requests to start fresh
  StorageManager.clearAll();
  console.log('Cleared requests before starting new recording session');
  
  isRecording = true;
  RequestInterceptor.start();
  
  // Notify all connected sidebars
  broadcastMessage({
    type: 'RECORDING_STARTED',
    timestamp: Date.now()
  });
  
  // Update browser action icon
  updateBrowserActionIcon(true);
}

/**
 * Stop recording network requests
 */
function stopRecording() {
  if (!isRecording) {
    console.log('Not recording');
    return;
  }
  
  console.log('Stopping recording...');
  isRecording = false;
  RequestInterceptor.stop();
  
  // Notify all connected sidebars
  broadcastMessage({
    type: 'RECORDING_STOPPED',
    timestamp: Date.now()
  });
  
  // Update browser action icon
  updateBrowserActionIcon(false);
}

/**
 * Update browser action icon based on recording state
 */
function updateBrowserActionIcon(recording) {
  const title = recording ? 'API Monitor (Recording)' : 'API Monitor (Stopped)';
  browser.browserAction.setTitle({ title });
  
  // Could also change icon color/badge here
  if (recording) {
    browser.browserAction.setBadgeText({ text: '●' });
    browser.browserAction.setBadgeBackgroundColor({ color: '#ff0000' });
  } else {
    browser.browserAction.setBadgeText({ text: '' });
  }
}

/**
 * Broadcast message to all connected ports
 */
function broadcastMessage(message) {
  connectedPorts.forEach(port => {
    try {
      port.postMessage(message);
    } catch (error) {
      console.error('Failed to send message to port:', error);
      connectedPorts.delete(port);
    }
  });
}

/**
 * Handle connection from sidebar
 */
browser.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
  
  if (port.name === 'sidebar') {
    connectedPorts.add(port);
    
    // Send current state to newly connected sidebar
    port.postMessage({
      type: 'STATE_UPDATE',
      isRecording,
      requestCount: StorageManager.requests.size,
      stats: StorageManager.getStatistics()
    });
    
    // Handle port disconnect
    port.onDisconnect.addListener(() => {
      console.log('Sidebar disconnected');
      connectedPorts.delete(port);
      
      // When the last sidebar closes, clear requests if not recording
      // This prevents old requests from showing when sidebar reopens
      if (connectedPorts.size === 0) {
        if (!isRecording) {
          console.log('Sidebar closed while not recording - clearing all requests');
          StorageManager.clearAll();
        } else {
          console.log('Sidebar closed but still recording - keeping requests');
        }
      }
    });
  }
});

/**
 * Handle messages from sidebar and other components
 */
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Received message:', message.type);
  
  switch (message.type) {
    case 'START_RECORDING':
      startRecording();
      sendResponse({ success: true, isRecording: true });
      break;
      
    case 'STOP_RECORDING':
      stopRecording();
      sendResponse({ success: true, isRecording: false });
      break;
      
    case 'GET_STATE':
      sendResponse({
        isRecording,
        requestCount: StorageManager.requests.size,
        stats: StorageManager.getStatistics()
      });
      break;
      
    case 'GET_REQUESTS':
      const filters = message.filters || {};
      const requests = StorageManager.getFilteredRequests(filters);
      sendResponse({ requests });
      break;
      
    case 'GET_REQUEST_DETAILS':
      const request = StorageManager.getRequest(message.requestId);
      sendResponse({ request });
      break;
      
    case 'CLEAR_DATA':
      StorageManager.clearAll();
      sendResponse({ success: true });
      break;
      
    case 'EXPORT_JSON':
      handleExportJSON(message.filters, sendResponse);
      return true; // Async response
      
    case 'SET_MAX_REQUESTS':
      StorageManager.setMaxRequests(message.maxRequests);
      sendResponse({ success: true });
      break;
      
    case 'REQUESTS_UPDATED':
      // Broadcast to all connected sidebars
      broadcastMessage(message);
      break;
      
    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }
  
  return false;
});

/**
 * Handle JSON export
 */
async function handleExportJSON(filters, sendResponse) {
  try {
    // Get filtered requests (same as what's shown in sidebar)
    const requests = StorageManager.getFilteredRequests(filters || {});
    
    // Format for export with URL, method, and status first for better readability
    const exportRequests = requests.map(req => ({
      url: req.url,
      method: req.method,
      status: req.statusCode,
      statusText: req.statusLine,
      duration: req.duration,
      type: req.apiType,
      id: req.id,
      timestamp: req.timestamp,
      date: new Date(req.timestamp).toISOString(),
      requestHeaders: req.requestHeaders,
      requestBody: req.requestBody,
      responseHeaders: req.responseHeaders,
      responseBody: req.responseBody,
      tabId: req.tabId,
      frameId: req.frameId
    }));
    
    const exportData = {
      exportDate: new Date().toISOString(),
      totalRequests: exportRequests.length,
      filters: filters || {},
      requests: exportRequests
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const filename = `api-monitor-export-${Date.now()}.json`;
    
    await browser.downloads.download({
      url: url,
      filename: filename,
      saveAs: true
    });
    
    sendResponse({ success: true, filename });
  } catch (error) {
    console.error('Export JSON failed:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Handle browser action click (toolbar icon)
 */
browser.browserAction.onClicked.addListener(() => {
  // Open sidebar
  browser.sidebarAction.open();
});

/**
 * Handle extension installation or update
 */
browser.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // First time installation
    browser.sidebarAction.open();
  }
});

// Initialize extension
initialize();

// Made with Bob
