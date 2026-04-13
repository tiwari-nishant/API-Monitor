/**
 * Storage Manager
 * Handles data persistence and retrieval for captured requests
 */

const StorageManager = {
  requests: new Map(),
  maxRequests: 2000,
  isInitialized: false,
  
  /**
   * Initialize storage manager
   */
  async init() {
    if (this.isInitialized) return;
    
    try {
      // Only load maxRequests setting, NOT old requests
      // This prevents old requests from reappearing when sidebar reopens
      const data = await browser.storage.local.get(['maxRequests']);
      
      if (data.maxRequests) {
        this.maxRequests = data.maxRequests;
      }
      
      // Always start with empty requests - don't load from storage
      this.requests = new Map();
      
      this.isInitialized = true;
      console.log('StorageManager initialized (fresh session, no old requests loaded)');
    } catch (error) {
      console.error('Failed to initialize StorageManager:', error);
    }
  },
  
  /**
   * Add a new request to storage
   * @param {Object} requestData - Request details
   */
  async addRequest(requestData) {
    // Ensure request has required fields
    if (!requestData.id || !requestData.url) {
      console.warn('Invalid request data:', requestData);
      return;
    }
    
    // Check if request already exists (prevent duplicates)
    if (this.requests.has(requestData.id)) {
      console.log('Request already exists, skipping duplicate:', requestData.id);
      return;
    }
    
    // Detect API type
    requestData.apiType = RequestParser.detectType(requestData);
    
    // Add to map
    this.requests.set(requestData.id, requestData);
    console.log('Added new request:', requestData.id, requestData.method, requestData.url);
    
    // Implement circular buffer - remove oldest if exceeds max
    if (this.requests.size > this.maxRequests) {
      const firstKey = this.requests.keys().next().value;
      this.requests.delete(firstKey);
      console.log('Removed oldest request to maintain buffer size');
    }
    
    // DON'T persist to storage - keep requests in memory only
    // This prevents old requests from reappearing when sidebar reopens
    
    // DON'T notify on add - only notify when request completes
    // This prevents showing pending requests that might be duplicates/redirects
  },
  
  /**
   * Update an existing request
   * @param {string} requestId - Request ID
   * @param {Object} updates - Fields to update
   * @param {boolean} notify - Whether to notify listeners (default: false for intermediate updates)
   */
  async updateRequest(requestId, updates, notify = false) {
    const request = this.requests.get(requestId);
    
    if (!request) {
      console.warn('Request not found for update:', requestId);
      return;
    }
    
    // Merge updates
    Object.assign(request, updates);
    
    // Calculate duration if completed
    if (updates.completedAt && request.timestamp) {
      request.duration = updates.completedAt - request.timestamp;
    }
    
    // Update status category
    if (updates.statusCode) {
      request.statusCategory = RequestParser.getStatusCategory(updates.statusCode);
    }
    
    // DON'T persist to storage - keep requests in memory only
    // This prevents old requests from reappearing when sidebar reopens
    
    // Only notify if explicitly requested (e.g., when request is completed)
    if (notify) {
      this.notifyUpdate();
    }
  },
  
  /**
   * Remove a request from storage
   * @param {string} requestId - Request ID to remove
   */
  removeRequest(requestId) {
    if (this.requests.has(requestId)) {
      this.requests.delete(requestId);
      console.log('Removed request:', requestId);
      return true;
    }
    return false;
  },
  
  /**
   * Get all requests sorted by timestamp
   * @returns {Array} - Array of request objects
   */
  getAllRequests() {
    return Array.from(this.requests.values())
      .sort((a, b) => a.timestamp - b.timestamp);
  },
  
  /**
   * Get a single request by ID
   * @param {string} requestId - Request ID
   * @returns {Object|null} - Request object or null
   */
  getRequest(requestId) {
    return this.requests.get(requestId) || null;
  },
  
  /**
   * Get filtered requests
   * @param {Object} filters - Filter criteria
   * @returns {Array} - Filtered requests
   */
  getFilteredRequests(filters = {}) {
    let requests = this.getAllRequests();
    
    // Filter by method
    if (filters.method && filters.method !== 'all') {
      requests = requests.filter(req => req.method === filters.method);
    }
    
    // Filter by status
    if (filters.status && filters.status !== 'all') {
      requests = requests.filter(req => {
        if (!req.statusCode) return false;
        const statusRange = Math.floor(req.statusCode / 100) + 'xx';
        return statusRange === filters.status;
      });
    }
    
    // Filter by search term
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      requests = requests.filter(req =>
        req.url.toLowerCase().includes(searchLower) ||
        req.method.toLowerCase().includes(searchLower)
      );
    }
    
    return requests;
  },
  
  /**
   * Get statistics about captured requests
   * @returns {Object} - Statistics object
   */
  getStatistics() {
    const requests = this.getAllRequests();
    const stats = {
      total: requests.length,
      byType: {
        Redfish: 0,
        WebSocket: 0,
        Static: 0,
        Other: 0
      },
      byStatus: {
        '2xx': 0,
        '3xx': 0,
        '4xx': 0,
        '5xx': 0
      },
      avgDuration: 0,
      totalDuration: 0
    };
    
    let totalDuration = 0;
    let durationCount = 0;
    
    requests.forEach(req => {
      // Count by type
      if (req.apiType) {
        stats.byType[req.apiType] = (stats.byType[req.apiType] || 0) + 1;
      }
      
      // Count by status
      if (req.statusCode) {
        const statusRange = Math.floor(req.statusCode / 100) + 'xx';
        stats.byStatus[statusRange] = (stats.byStatus[statusRange] || 0) + 1;
      }
      
      // Calculate average duration
      if (req.duration && req.duration > 0) {
        totalDuration += req.duration;
        durationCount++;
      }
    });
    
    stats.totalDuration = totalDuration;
    stats.avgDuration = durationCount > 0 ? Math.round(totalDuration / durationCount) : 0;
    
    return stats;
  },
  
  /**
   * Clear all stored requests
   */
  async clearAll() {
    // Clear in-memory requests
    this.requests.clear();
    
    // Clear any persisted requests from storage
    await browser.storage.local.remove('requests');
    
    // Also clear pending requests in the interceptor to prevent them from reappearing
    if (typeof RequestInterceptor !== 'undefined' && RequestInterceptor.pendingRequests) {
      RequestInterceptor.pendingRequests.clear();
      console.log('Cleared pending requests from interceptor');
    }
    
    this.notifyUpdate();
    console.log('All requests cleared from memory and storage');
  },
  
  /**
   * Set maximum number of requests to store
   * @param {number} max - Maximum requests
   */
  async setMaxRequests(max) {
    this.maxRequests = max;
    await browser.storage.local.set({ maxRequests: max });
    
    // Trim if current size exceeds new max
    while (this.requests.size > this.maxRequests) {
      const firstKey = this.requests.keys().next().value;
      this.requests.delete(firstKey);
    }
    
    // Save maxRequests setting only (not the requests themselves)
    await browser.storage.local.set({ maxRequests: this.maxRequests });
  },
  
  /**
   * Persist requests to browser storage
   * NOTE: This is now disabled to prevent old requests from reappearing
   * Requests are kept in memory only during the recording session
   */
  async persist() {
    // Disabled - we no longer persist requests to storage
    // This prevents the issue where 1000 old requests reappear when reopening the sidebar
    // Requests are now kept in memory only and cleared when the extension reloads
    return;
  },
  
  /**
   * Notify listeners about updates
   */
  notifyUpdate() {
    // Send message to all connected ports (sidebar)
    const message = {
      type: 'REQUESTS_UPDATED',
      count: this.requests.size,
      stats: this.getStatistics()
    };
    
    // Try to send via runtime message
    browser.runtime.sendMessage(message).catch((error) => {
      // Sidebar might not be open, that's okay
      console.log('No sidebar connected to receive update');
    });
  },
  
  /**
   * Export all requests
   * @returns {Array} - All requests for export
   */
  exportRequests() {
    return this.getAllRequests().map(req => ({
      id: req.id,
      timestamp: req.timestamp,
      date: new Date(req.timestamp).toISOString(),
      url: req.url,
      method: req.method,
      type: req.apiType,
      status: req.statusCode,
      statusText: req.statusLine,
      duration: req.duration,
      requestHeaders: req.requestHeaders,
      requestBody: req.requestBody,
      responseHeaders: req.responseHeaders,
      responseBody: req.responseBody,
      tabId: req.tabId,
      frameId: req.frameId
    }));
  }
};

// Initialize on load
StorageManager.init();
