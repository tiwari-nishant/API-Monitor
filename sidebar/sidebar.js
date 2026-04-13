/**
 * Sidebar Script
 * Handles UI interactions and communication with background script
 */

// UI Elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
// const clearBtn = document.getElementById('clearBtn'); // Commented out - will be placed elsewhere
const exportJsonBtn = document.getElementById('exportJsonBtn');
const toggleListBtn = document.getElementById('toggleListBtn');
const toggleLabel = document.getElementById('toggleLabel');
const searchInput = document.getElementById('searchInput');
const methodFilter = document.getElementById('methodFilter');
const statusFilter = document.getElementById('statusFilter');
const requestList = document.getElementById('requestList');
const detailsPanel = document.getElementById('detailsPanel');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');
const detailsContent = document.getElementById('detailsContent');

// Statistics elements
const totalCount = document.getElementById('totalCount');
// Hidden for now - to be added later
// const redfishCount = document.getElementById('redfishCount');
// const wsCount = document.getElementById('wsCount');
// const avgDuration = document.getElementById('avgDuration');

// State
let isRecording = false;
let currentRequests = [];
let selectedRequestId = null;
let port = null;
let isListVisible = true; // Track list visibility state
let pollingInterval = null; // Store interval ID for cleanup
let isLoadingRequests = false; // Prevent concurrent loads

/**
 * Initialize sidebar
 */
async function initialize() {
  console.log('Initializing sidebar...');
  
  try {
    // Connect to background script
    port = browser.runtime.connect({ name: 'sidebar' });
    console.log('Connected to background script');
    
    // Listen for messages from background
    port.onMessage.addListener(handleBackgroundMessage);
    
    // Get initial state
    console.log('Requesting initial state...');
    const state = await browser.runtime.sendMessage({ type: 'GET_STATE' });
    console.log('Received state:', state);
    updateUIState(state);
    
    // Load requests
    console.log('Loading requests...');
    await loadRequests();
    console.log('Requests loaded, count:', currentRequests.length);
  } catch (error) {
    console.error('Failed to initialize sidebar:', error);
  }
  
  // Setup event listeners
  setupEventListeners();
  
  // Start polling for updates when recording
  startPolling();
  
  console.log('Sidebar initialized');
}

/**
 * Start polling for request updates
 */
function startPolling() {
  // Clear any existing interval
  if (pollingInterval) {
    clearInterval(pollingInterval);
  }
  
  // Poll every 5 seconds when recording (increased from 2s to reduce load)
  pollingInterval = setInterval(async () => {
    if (isRecording && !isLoadingRequests) {
      await loadRequests();
    }
  }, 5000); // Increased to 5 seconds
}

/**
 * Stop polling for request updates
 */
function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Control buttons
  startBtn.addEventListener('click', handleStartRecording);
  stopBtn.addEventListener('click', handleStopRecording);
  // clearBtn.addEventListener('click', handleClearData); // Commented out - will be placed elsewhere
  exportJsonBtn.addEventListener('click', () => handleExport('json'));
  toggleListBtn.addEventListener('click', handleToggleList);
  
  // Filter controls
  searchInput.addEventListener('input', debounce(handleFilterChange, 300));
  methodFilter.addEventListener('change', handleFilterChange);
  statusFilter.addEventListener('change', handleFilterChange);
  
  // Details panel
  closeDetailsBtn.addEventListener('click', hideDetailsPanel);
}

/**
 * Handle messages from background script
 */
function handleBackgroundMessage(message) {
  console.log('Received message:', message.type);
  
  switch (message.type) {
    case 'STATE_UPDATE':
      updateUIState(message);
      break;
      
    case 'RECORDING_STARTED':
      isRecording = true;
      updateRecordingButtons();
      // Clear the UI and reload to show fresh state
      currentRequests = [];
      renderRequestList();
      updateStatistics({ total: 0, byType: {}, byStatus: {}, avgDuration: 0 });
      loadRequests();
      startPolling(); // Start polling when recording starts
      break;
      
    case 'RECORDING_STOPPED':
      isRecording = false;
      updateRecordingButtons();
      stopPolling(); // Stop polling when recording stops
      break;
      
    case 'REQUESTS_UPDATED':
      loadRequests();
      updateStatistics(message.stats);
      break;
  }
}

/**
 * Update UI state
 */
function updateUIState(state) {
  isRecording = state.isRecording;
  updateRecordingButtons();
  
  if (state.stats) {
    updateStatistics(state.stats);
  }
}

/**
 * Update recording button states
 */
function updateRecordingButtons() {
  startBtn.disabled = isRecording;
  stopBtn.disabled = !isRecording;
  
  if (isRecording) {
    startBtn.classList.add('disabled');
    stopBtn.classList.remove('disabled');
  } else {
    startBtn.classList.remove('disabled');
    stopBtn.classList.add('disabled');
  }
}

/**
 * Handle start recording
 */
async function handleStartRecording() {
  try {
    await browser.runtime.sendMessage({ type: 'START_RECORDING' });
    console.log('Recording started');
  } catch (error) {
    console.error('Failed to start recording:', error);
    showNotification('Failed to start recording', 'error');
  }
}

/**
 * Handle stop recording
 */
async function handleStopRecording() {
  try {
    await browser.runtime.sendMessage({ type: 'STOP_RECORDING' });
    console.log('Recording stopped');
  } catch (error) {
    console.error('Failed to stop recording:', error);
    showNotification('Failed to stop recording', 'error');
  }
}

/**
 * Handle clear data
 */
async function handleClearData() {
  if (!confirm('Are you sure you want to clear all captured requests?')) {
    return;
  }
  
  try {
    await browser.runtime.sendMessage({ type: 'CLEAR_DATA' });
    currentRequests = [];
    renderRequestList();
    updateStatistics({ total: 0, byType: {}, byStatus: {}, avgDuration: 0 });
    showNotification('All requests cleared', 'success');
  } catch (error) {
    console.error('Failed to clear data:', error);
    showNotification('Failed to clear data', 'error');
  }
}

/**
 * Handle export
 */
async function handleExport(format) {
  try {
    // Get current filters to export only visible requests
    const filters = {
      search: searchInput.value.trim(),
      method: methodFilter.value,
      status: statusFilter.value
    };
    
    const messageType = format === 'json' ? 'EXPORT_JSON' : 'EXPORT_CSV';
    const response = await browser.runtime.sendMessage({
      type: messageType,
      filters: filters
    });
    
    if (response.success) {
      showNotification(`Exported ${response.filename || format.toUpperCase()}`, 'success');
    } else {
      showNotification(`Export failed: ${response.error}`, 'error');
    }
  } catch (error) {
    console.error('Export failed:', error);
    showNotification('Export failed', 'error');
  }
}

/**
 * Handle toggle list visibility
 */
function handleToggleList() {
  isListVisible = toggleListBtn.checked;
  
  // Get the filter panel and request list container
  const filterPanel = document.querySelector('.filter-panel');
  const requestListContainer = document.querySelector('.request-list-container');
  
  if (isListVisible) {
    // Show the list and filters
    filterPanel.style.display = 'block';
    requestListContainer.style.display = 'flex';
    toggleLabel.textContent = 'Hide List';
  } else {
    // Hide the list and filters
    filterPanel.style.display = 'none';
    requestListContainer.style.display = 'none';
    toggleLabel.textContent = 'Show List';
  }
}

/**
 * Handle filter change
 */
async function handleFilterChange() {
  await loadRequests();
}

/**
 * Load requests with current filters
 */
async function loadRequests() {
  // Prevent concurrent loads
  if (isLoadingRequests) {
    return;
  }
  
  isLoadingRequests = true;
  
  try {
    const filters = {
      search: searchInput.value.trim(),
      method: methodFilter.value,
      status: statusFilter.value
    };
    
    // Get filtered requests
    const response = await browser.runtime.sendMessage({
      type: 'GET_REQUESTS',
      filters
    });
    
    currentRequests = response.requests || [];
    renderRequestList();
    
    // Calculate statistics from filtered requests
    calculateAndUpdateStatistics(currentRequests);
  } catch (error) {
    console.error('Failed to load requests:', error);
  } finally {
    isLoadingRequests = false;
  }
}

/**
 * Calculate statistics from filtered requests
 */
function calculateAndUpdateStatistics(requests) {
  const stats = {
    total: requests.length,
    byType: {
      Redfish: 0,
      WebSocket: 0
    },
    avgDuration: 0
  };
  
  let totalDuration = 0;
  let durationCount = 0;
  
  requests.forEach(req => {
    // Count by type
    if (req.apiType === 'Redfish') {
      stats.byType.Redfish++;
    } else if (req.apiType === 'WebSocket') {
      stats.byType.WebSocket++;
    }
    
    // Calculate average duration
    if (req.duration && req.duration > 0) {
      totalDuration += req.duration;
      durationCount++;
    }
  });
  
  stats.avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
  
  updateStatistics(stats);
}

/**
 * Render request list
 */
function renderRequestList() {
  console.log('Rendering request list, count:', currentRequests.length);
  
  if (currentRequests.length === 0) {
    console.log('No requests to display, showing empty state');
    requestList.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📡</div>
        <div class="empty-text">No requests found</div>
        <div class="empty-hint">${isRecording ? 'Waiting for network activity...' : 'Click "Start Recording" to begin'}</div>
      </div>
    `;
    return;
  }
  
  console.log('Creating HTML for', currentRequests.length, 'requests');
  const html = currentRequests.map(req => createRequestItem(req)).join('');
  requestList.innerHTML = html;
  console.log('HTML rendered, adding click listeners');
  
  // Add click listeners
  requestList.querySelectorAll('.request-item').forEach(item => {
    item.addEventListener('click', () => {
      const requestId = item.dataset.requestId;
      showRequestDetails(requestId);
    });
  });
  
  console.log('Request list rendering complete');
}

/**
 * Create request item HTML
 */
function createRequestItem(request) {
  const statusClass = getStatusClass(request.statusCode);
  const typeClass = `type-${request.apiType.toLowerCase()}`;
  const duration = request.duration ? `${request.duration}ms` : '-';
  const time = formatTime(request.timestamp);
  const url = truncateUrl(request.url, 50);
  
  return `
    <div class="request-item ${statusClass}" data-request-id="${request.id}">
      <span class="request-method ${request.method.toLowerCase()}">${request.method}</span>
      <span class="request-url" title="${request.url}">${url}</span>
      <span class="request-status">${request.statusCode || '-'}</span>
      <span class="request-type ${typeClass}">${request.apiType}</span>
      <span class="request-time">${duration}</span>
    </div>
  `;
}

/**
 * Show request details
 */
async function showRequestDetails(requestId) {
  try {
    const response = await browser.runtime.sendMessage({ 
      type: 'GET_REQUEST_DETAILS',
      requestId 
    });
    
    if (response.request) {
      selectedRequestId = requestId;
      renderRequestDetails(response.request);
      detailsPanel.classList.add('visible');
    }
  } catch (error) {
    console.error('Failed to load request details:', error);
  }
}

/**
 * Render request details
 */
function renderRequestDetails(request) {
  const html = `
    <div class="detail-section">
      <h4 class="detail-section-title">General</h4>
      <div class="detail-row">
        <span class="detail-label">URL:</span>
        <span class="detail-value">${escapeHtml(request.url)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Method:</span>
        <span class="detail-value">${request.method}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Type:</span>
        <span class="detail-value">${request.apiType}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value">${request.statusCode || 'N/A'} ${request.statusLine || ''}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Duration:</span>
        <span class="detail-value">${request.duration ? request.duration + 'ms' : 'N/A'}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Timestamp:</span>
        <span class="detail-value">${formatDateTime(request.timestamp)}</span>
      </div>
    </div>
    
    <div class="detail-section">
      <h4 class="detail-section-title">Request Headers</h4>
      <pre class="detail-code">${formatHeaders(request.requestHeaders)}</pre>
    </div>
    
    ${request.requestBody ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Request Body</h4>
      <pre class="detail-code">${escapeHtml(request.requestBody)}</pre>
    </div>
    ` : ''}
    
    <div class="detail-section">
      <h4 class="detail-section-title">Response Headers</h4>
      <pre class="detail-code">${formatHeaders(request.responseHeaders)}</pre>
    </div>
    
    ${request.responseBody ? `
    <div class="detail-section">
      <h4 class="detail-section-title">Response Body</h4>
      <pre class="detail-code">${escapeHtml(request.responseBody)}</pre>
    </div>
    ` : ''}
  `;
  
  detailsContent.innerHTML = html;
}

/**
 * Hide details panel
 */
function hideDetailsPanel() {
  detailsPanel.classList.remove('visible');
  selectedRequestId = null;
}

/**
 * Update statistics
 */
function updateStatistics(stats) {
  totalCount.textContent = stats.total || 0;
  // Hidden for now - to be added later
  // redfishCount.textContent = stats.byType?.Redfish || 0;
  // wsCount.textContent = stats.byType?.WebSocket || 0;
  // avgDuration.textContent = (stats.avgDuration || 0) + 'ms';
}

/**
 * Utility functions
 */

function getStatusClass(statusCode) {
  if (!statusCode) return 'status-pending';
  if (statusCode >= 200 && statusCode < 300) return 'status-success';
  if (statusCode >= 300 && statusCode < 400) return 'status-redirect';
  if (statusCode >= 400 && statusCode < 500) return 'status-client-error';
  if (statusCode >= 500) return 'status-server-error';
  return '';
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
}

function formatDateTime(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString();
}

function truncateUrl(url, maxLength) {
  if (url.length <= maxLength) return url;
  return url.substring(0, maxLength) + '...';
}

function formatHeaders(headers) {
  if (!headers || Object.keys(headers).length === 0) {
    return 'No headers';
  }
  return JSON.stringify(headers, null, 2);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showNotification(message, type = 'info') {
  // Simple notification - could be enhanced with a toast component
  console.log(`[${type.toUpperCase()}] ${message}`);
  
  // You could add a visual notification here
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

// Made with Bob
