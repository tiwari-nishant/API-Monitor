/**
 * Request Interceptor
 * Captures network requests using webRequest API
 */

const RequestInterceptor = {
  isActive: false,
  pendingRequests: new Map(),
  activeTabId: null, // Track the active tab
  activeTabUrl: null, // Track the active tab's URL
  
  /**
   * Check if the active tab URL contains 'stglabs'
   */
  isStglabsTab() {
    if (!this.activeTabUrl) {
      return false;
    }
    return this.activeTabUrl.toLowerCase().includes('stglabs');
  },
  
  /**
   * Check if URL should be captured
   * Only capture Redfish API calls, exclude node_modules and src/views
   */
  shouldCaptureUrl(url) {
    // Exclude node_modules
    if (url.includes('/node_modules/')) {
      return false;
    }
    
    // Exclude src/views
    if (url.includes('/src/views/')) {
      return false;
    }
    
    // Only capture Redfish API calls (contains /redfish/ in the path)
    // This is case-insensitive to handle /redfish/, /Redfish/, etc.
    if (url.toLowerCase().includes('/redfish/')) {
      return true;
    }
    
    // Exclude everything else
    return false;
  },
  
  /**
   * Start intercepting network requests
   */
  async start() {
    if (this.isActive) {
      console.log('Request interceptor already active');
      return;
    }
    
    console.log('Starting request interceptor...');
    
    // Get the active tab to filter requests
    try {
      const tabs = await browser.tabs.query({ active: true, currentWindow: true });
      if (tabs.length > 0) {
        this.activeTabId = tabs[0].id;
        this.activeTabUrl = tabs[0].url;
        console.log('Tracking active tab:', this.activeTabId, 'URL:', this.activeTabUrl);
        console.log('Is stglabs tab:', this.isStglabsTab());
      }
    } catch (error) {
      console.error('Failed to get active tab:', error);
    }
    
    // Listen to tab changes to update active tab
    browser.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    
    // Listen to tab URL changes
    browser.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    
    // Temporarily listen to all URLs to debug the issue
    // TODO: Re-add Redfish filtering after confirming it works
    const urlPatterns = ["<all_urls>"];
    
    // Capture request initiation with body
    browser.webRequest.onBeforeRequest.addListener(
      this.handleBeforeRequest.bind(this),
      { urls: urlPatterns },
      ["requestBody"]
    );
    
    // Capture request headers being sent
    browser.webRequest.onSendHeaders.addListener(
      this.handleSendHeaders.bind(this),
      { urls: urlPatterns },
      ["requestHeaders"]
    );
    
    // Capture response headers received
    browser.webRequest.onHeadersReceived.addListener(
      this.handleHeadersReceived.bind(this),
      { urls: urlPatterns },
      ["responseHeaders"]
    );
    
    // Capture completed requests
    browser.webRequest.onCompleted.addListener(
      this.handleCompleted.bind(this),
      { urls: urlPatterns },
      ["responseHeaders"]
    );
    
    // Capture failed requests
    browser.webRequest.onErrorOccurred.addListener(
      this.handleError.bind(this),
      { urls: urlPatterns }
    );
    
    this.isActive = true;
    console.log('Request interceptor started');
  },
  
  /**
   * Stop intercepting network requests
   */
  stop() {
    if (!this.isActive) {
      console.log('Request interceptor not active');
      return;
    }
    
    console.log('Stopping request interceptor...');
    
    // Remove all listeners
    browser.webRequest.onBeforeRequest.removeListener(this.handleBeforeRequest);
    browser.webRequest.onSendHeaders.removeListener(this.handleSendHeaders);
    browser.webRequest.onHeadersReceived.removeListener(this.handleHeadersReceived);
    browser.webRequest.onCompleted.removeListener(this.handleCompleted);
    browser.webRequest.onErrorOccurred.removeListener(this.handleError);
    browser.tabs.onActivated.removeListener(this.handleTabActivated);
    browser.tabs.onUpdated.removeListener(this.handleTabUpdated);
    
    this.isActive = false;
    this.activeTabId = null;
    this.activeTabUrl = null;
    this.pendingRequests.clear();
    console.log('Request interceptor stopped');
  },
  
  /**
   * Handle tab activation to track active tab
   */
  async handleTabActivated(activeInfo) {
    this.activeTabId = activeInfo.tabId;
    
    // Get the tab URL
    try {
      const tab = await browser.tabs.get(activeInfo.tabId);
      this.activeTabUrl = tab.url;
      console.log('Active tab changed to:', this.activeTabId, 'URL:', this.activeTabUrl);
      console.log('Is stglabs tab:', this.isStglabsTab());
    } catch (error) {
      console.error('Failed to get tab URL:', error);
    }
  },
  
  /**
   * Handle tab URL updates
   */
  handleTabUpdated(tabId, changeInfo, tab) {
    // Only track URL changes for the active tab
    if (tabId === this.activeTabId && changeInfo.url) {
      this.activeTabUrl = changeInfo.url;
      console.log('Active tab URL updated:', this.activeTabUrl);
      console.log('Is stglabs tab:', this.isStglabsTab());
    }
  },
  
  /**
   * Handle request before it's sent
   */
  handleBeforeRequest(details) {
    // Don't process if not active
    if (!this.isActive) {
      return;
    }
    
    // Filter using shouldCaptureUrl to only get Redfish calls
    if (!this.shouldCaptureUrl(details.url)) {
      return;
    }
    
    // Only capture requests from the active tab (matching browser Network tab behavior)
    // Allow tabId -1 for background requests if needed, but primarily focus on active tab
    if (this.activeTabId !== null && details.tabId !== this.activeTabId && details.tabId !== -1) {
      console.log('Ignoring request from inactive tab:', details.tabId, 'Active:', this.activeTabId);
      return;
    }
    
    // Filter out extension-internal requests (tabId < -1)
    if (details.tabId < -1) {
      console.log('Ignoring extension-internal request:', details.url);
      return;
    }
    
    // Only capture if active tab URL contains 'stglabs'
    if (!this.isStglabsTab()) {
      console.log('Ignoring request - active tab is not a stglabs domain:', this.activeTabUrl);
      return;
    }
    
    console.log('Redfish request captured:', {
      url: details.url,
      tabId: details.tabId,
      method: details.method,
      activeTabUrl: this.activeTabUrl
    });
    
    const requestData = {
      id: details.requestId,
      timestamp: Date.now(),
      url: details.url,
      method: details.method,
      type: details.type,
      tabId: details.tabId,
      frameId: details.frameId,
      requestBody: this.parseRequestBody(details.requestBody),
      status: 'pending'
    };
    
    // Store in pending requests
    this.pendingRequests.set(details.requestId, requestData);
    
    // Add to storage
    StorageManager.addRequest(requestData);
  },
  
  /**
   * Handle request headers being sent
   */
  handleSendHeaders(details) {
    // Only process if actively recording
    if (!this.isActive) {
      return;
    }
    
    // Only process if request was captured in handleBeforeRequest
    const requestData = this.pendingRequests.get(details.requestId);
    if (!requestData) {
      return;
    }
    
    requestData.requestHeaders = this.headersToObject(details.requestHeaders);
    requestData.sentAt = Date.now();
    
    // Update without notifying (intermediate state)
    StorageManager.updateRequest(details.requestId, {
      requestHeaders: this.headersToObject(details.requestHeaders),
      sentAt: Date.now()
    }, false);
  },
  
  /**
   * Handle response headers received
   */
  handleHeadersReceived(details) {
    // Only process if actively recording
    if (!this.isActive) {
      return;
    }
    
    // Only process if request was captured in handleBeforeRequest
    const requestData = this.pendingRequests.get(details.requestId);
    if (!requestData) {
      return;
    }
    
    requestData.responseHeaders = this.headersToObject(details.responseHeaders);
    requestData.statusCode = details.statusCode;
    requestData.statusLine = details.statusLine;
    requestData.receivedAt = Date.now();
    
    // Check if response is from cache
    requestData.fromCache = this.isFromCache(details);
    
    // Update without notifying (intermediate state)
    StorageManager.updateRequest(details.requestId, {
      responseHeaders: this.headersToObject(details.responseHeaders),
      statusCode: details.statusCode,
      statusLine: details.statusLine,
      receivedAt: Date.now(),
      fromCache: this.isFromCache(details)
    }, false);
  },
  
  /**
   * Handle completed request
   */
  async handleCompleted(details) {
    // Only process if actively recording
    if (!this.isActive) {
      return;
    }
    
    // Only process if request was captured in handleBeforeRequest
    const requestData = this.pendingRequests.get(details.requestId);
    if (!requestData) {
      return;
    }
    
    // Check if request is from cache
    const fromCache = this.isFromCache(details);
    
    // Skip cached requests to match browser Network tab behavior
    if (fromCache) {
      console.log('Skipping cached request:', details.url);
      this.pendingRequests.delete(details.requestId);
      // Remove from storage if it was added
      StorageManager.removeRequest(details.requestId);
      return;
    }
    
    requestData.completed = true;
    requestData.completedAt = Date.now();
    requestData.status = 'completed';
    requestData.fromCache = false;
    
    // Try to fetch response body for same-origin requests
    const responseBody = await this.fetchResponseBody(details);
    
    // Update and NOTIFY (request is complete)
    StorageManager.updateRequest(details.requestId, {
      completed: true,
      completedAt: Date.now(),
      status: 'completed',
      responseBody: responseBody,
      fromCache: false
    }, true);
    
    // Clean up pending request after a delay
    setTimeout(() => {
      this.pendingRequests.delete(details.requestId);
    }, 5000);
  },
  
  /**
   * Handle request error
   */
  handleError(details) {
    // Only process if actively recording
    if (!this.isActive) {
      return;
    }
    
    // Only process if request was captured in handleBeforeRequest
    const requestData = this.pendingRequests.get(details.requestId);
    if (!requestData) {
      return;
    }
    
    requestData.error = true;
    requestData.errorMessage = details.error;
    requestData.status = 'error';
    requestData.completedAt = Date.now();
    
    // Update and NOTIFY (request failed)
    StorageManager.updateRequest(details.requestId, {
      error: true,
      errorMessage: details.error,
      status: 'error',
      completedAt: Date.now()
    }, true);
    
    // Clean up pending request
    setTimeout(() => {
      this.pendingRequests.delete(details.requestId);
    }, 5000);
  },
  
  /**
   * Parse request body from webRequest details
   */
  parseRequestBody(requestBody) {
    if (!requestBody) return null;
    
    try {
      // Handle FormData
      if (requestBody.formData) {
        return JSON.stringify(requestBody.formData, null, 2);
      }
      
      // Handle raw bytes
      if (requestBody.raw && requestBody.raw.length > 0) {
        const decoder = new TextDecoder('utf-8');
        let fullText = '';
        
        for (const chunk of requestBody.raw) {
          if (chunk.bytes) {
            const text = decoder.decode(new Uint8Array(chunk.bytes));
            fullText += text;
          }
        }
        
        // Try to parse as JSON for pretty printing
        try {
          const json = JSON.parse(fullText);
          return JSON.stringify(json, null, 2);
        } catch (e) {
          return fullText;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Failed to parse request body:', error);
      return null;
    }
  },
  
  /**
   * Convert headers array to object
   */
  headersToObject(headers) {
    if (!headers) return {};
    
    const obj = {};
    headers.forEach(header => {
      obj[header.name] = header.value;
    });
    return obj;
  },
  
  /**
   * Attempt to fetch response body
   * Note: This only works for same-origin requests or CORS-enabled responses
   */
  async fetchResponseBody(details) {
    // Skip for certain types
    if (details.type === 'image' || details.type === 'media' || details.type === 'font') {
      return '[Binary content not captured]';
    }
    
    // Skip for large responses (> 1MB)
    const contentLength = this.getContentLength(details.responseHeaders);
    if (contentLength && contentLength > 1048576) {
      return '[Response too large to capture]';
    }
    
    try {
      // Try to fetch the response
      // Note: This creates a new request, so it may not capture the exact original response
      const response = await fetch(details.url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-cache'
      });
      
      const contentType = response.headers.get('content-type') || '';
      
      // Only capture text-based responses
      if (contentType.includes('text/') || 
          contentType.includes('application/json') || 
          contentType.includes('application/xml') ||
          contentType.includes('application/javascript')) {
        const text = await response.text();
        
        // Limit response body size
        if (text.length > 100000) {
          return text.substring(0, 100000) + '\n... [truncated]';
        }
        
        return text;
      }
      
      return '[Binary or non-text content]';
    } catch (error) {
      // CORS or other fetch error
      return '[Response body not accessible due to CORS]';
    }
  },
  
  /**
   * Get content length from response headers
   */
  getContentLength(headers) {
    if (!headers) return null;
    
    const contentLengthHeader = headers.find(
      h => h.name.toLowerCase() === 'content-length'
    );
    
    return contentLengthHeader ? parseInt(contentLengthHeader.value, 10) : null;
  },
  
  /**
   * Check if response is from cache
   * Uses multiple heuristics to detect cached responses
   */
  isFromCache(details) {
    // Check if fromCache property is available (Firefox provides this)
    if (details.fromCache === true) {
      return true;
    }
    
    // Check response headers for cache indicators
    const headers = this.headersToObject(details.responseHeaders);
    
    // Check for X-Firefox-Spdy header which indicates cached response
    if (headers['X-Firefox-Spdy'] || headers['x-firefox-spdy']) {
      return true;
    }
    
    // Check for Age header - if present and > 0, likely from cache
    const age = headers['Age'] || headers['age'];
    if (age && parseInt(age, 10) > 0) {
      return true;
    }
    
    // Check Cache-Control and check if response time is suspiciously fast
    // This is a heuristic - very fast responses might be cached
    const cacheControl = headers['Cache-Control'] || headers['cache-control'];
    if (cacheControl && cacheControl.includes('max-age')) {
      // If response came back in less than 10ms, likely cached
      const requestData = this.pendingRequests.get(details.requestId);
      if (requestData && requestData.sentAt) {
        const responseTime = Date.now() - requestData.sentAt;
        if (responseTime < 10) {
          return true;
        }
      }
    }
    
    return false;
  },
  
  /**
   * Get current status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      pendingCount: this.pendingRequests.size,
      activeTabId: this.activeTabId
    };
  }
};

