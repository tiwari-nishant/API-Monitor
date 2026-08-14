/**
 * Background Script — Safari
 * Same logic as background.js but uses browser.action (MV3 standard).
 * No sidePanel, no downloads API, no browserAction/sidebarAction.
 * Export is handled client-side in sidebar.js via anchor download.
 */

// Extension state
let isRecording = false;
let connectedPorts = new Set();

console.log('API Network Monitor background script loaded (Safari)');

/**
 * Initialize extension
 */
async function initialize() {
  console.log('Initializing API Network Monitor...');
  await StorageManager.init();
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
  if (isRecording) return;
  console.log('Starting recording...');
  StorageManager.clearAll();
  isRecording = true;
  RequestInterceptor.start();
  broadcastMessage({ type: 'RECORDING_STARTED', timestamp: Date.now() });
  updateBrowserActionIcon(true);
}

/**
 * Stop recording network requests
 */
function stopRecording() {
  if (!isRecording) return;
  console.log('Stopping recording...');
  isRecording = false;
  RequestInterceptor.stop();
  broadcastMessage({ type: 'RECORDING_STOPPED', timestamp: Date.now() });
  updateBrowserActionIcon(false);
}

/**
 * Update browser action icon based on recording state
 * Uses browser.action (MV3) instead of browser.browserAction (MV2/Firefox).
 */
function updateBrowserActionIcon(recording) {
  const title = recording ? 'API Monitor (Recording)' : 'API Monitor (Stopped)';
  browser.action.setTitle({ title });
  if (recording) {
    browser.action.setBadgeText({ text: '●' });
    browser.action.setBadgeBackgroundColor({ color: '#ff0000' });
  } else {
    browser.action.setBadgeText({ text: '' });
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
 * Handle connection from sidebar popup
 */
browser.runtime.onConnect.addListener((port) => {
  console.log('Port connected:', port.name);
  if (port.name === 'sidebar') {
    connectedPorts.add(port);
    port.postMessage({
      type: 'STATE_UPDATE',
      isRecording,
      requestCount: StorageManager.requests.size,
      stats: StorageManager.getStatistics()
    });
    port.onDisconnect.addListener(() => {
      console.log('Sidebar disconnected');
      connectedPorts.delete(port);
      if (connectedPorts.size === 0 && !isRecording) {
        StorageManager.clearAll();
      }
    });
  }
});

/**
 * Handle messages from sidebar and other components.
 * EXPORT_JSON is handled client-side in sidebar.js on Safari — this
 * handler returns the raw data and the sidebar triggers the download.
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

    case 'GET_REQUESTS': {
      const filters = message.filters || {};
      const requests = StorageManager.getFilteredRequests(filters);
      sendResponse({ requests });
      break;
    }

    case 'GET_REQUEST_DETAILS': {
      const request = StorageManager.getRequest(message.requestId);
      sendResponse({ request });
      break;
    }

    case 'CLEAR_DATA':
      StorageManager.clearAll();
      sendResponse({ success: true });
      break;

    case 'EXPORT_JSON': {
      // Return data to sidebar; the sidebar handles the actual file download
      // using an anchor element (Safari has no downloads API).
      const requests = StorageManager.getFilteredRequests(message.filters || {});
      const exportRequests = requests.map(req => ({
        url: req.url,
        method: req.method,
        status: req.statusCode,
        statusText: req.statusLine,
        duration: req.duration,
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
      sendResponse({
        success: true,
        exportData: {
          exportDate: new Date().toISOString(),
          totalRequests: exportRequests.length,
          filters: message.filters || {},
          requests: exportRequests
        }
      });
      break;
    }

    case 'IMPORT_REQUESTS':
      handleImportRequests(message.requests, sendResponse);
      return true; // async

    case 'SET_MAX_REQUESTS':
      StorageManager.setMaxRequests(message.maxRequests);
      sendResponse({ success: true });
      break;

    case 'REQUESTS_UPDATED':
      broadcastMessage(message);
      break;

    default:
      console.warn('Unknown message type:', message.type);
      sendResponse({ error: 'Unknown message type' });
  }

  return false;
});

/**
 * Handle import requests
 */
async function handleImportRequests(requests, sendResponse) {
  try {
    if (!Array.isArray(requests)) throw new Error('Invalid requests data: expected an array');
    let importedCount = 0;
    for (const req of requests) {
      try {
        if (!req.url || !req.method) continue;
        await StorageManager.addRequest({
          id: req.id || `imported_${Date.now()}_${importedCount}`,
          timestamp: req.timestamp || Date.now(),
          url: req.url,
          method: req.method,
          statusCode: req.status || req.statusCode,
          statusLine: req.statusText || req.statusLine,
          duration: req.duration,
          requestHeaders: req.requestHeaders || {},
          requestBody: req.requestBody,
          responseHeaders: req.responseHeaders || {},
          responseBody: req.responseBody,
          tabId: req.tabId || -1,
          frameId: req.frameId || 0,
          completed: true,
          status: 'completed'
        });
        importedCount++;
      } catch (e) {
        console.error('Failed to import request:', e, req);
      }
    }
    broadcastMessage({
      type: 'REQUESTS_UPDATED',
      count: StorageManager.requests.size,
      stats: StorageManager.getStatistics()
    });
    sendResponse({ success: true, imported: importedCount, total: requests.length });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Initialize extension
initialize();

// Made with Bob
