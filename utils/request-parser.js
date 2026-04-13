/**
 * Request Parser Utility
 * Detects and categorizes different types of API requests
 */

const RequestParser = {
  /**
   * Detect the type of API request
   * @param {Object} request - Request details
   * @returns {string} - Request type (REST, WebSocket, Static, Other)
   */
  detectType(request) {
    const url = request.url.toLowerCase();
    const contentType = this.getContentType(request.requestHeaders);
    
    // WebSocket detection
    if (url.startsWith('ws://') || url.startsWith('wss://')) {
      return 'WebSocket';
    }
    
    // Check for WebSocket upgrade in headers
    if (request.requestHeaders) {
      const upgradeHeader = Object.keys(request.requestHeaders).find(
        key => key.toLowerCase() === 'upgrade'
      );
      if (upgradeHeader && request.requestHeaders[upgradeHeader].toLowerCase() === 'websocket') {
        return 'WebSocket';
      }
    }
    
    // Static assets detection
    if (this.isStaticAsset(url)) {
      return 'Static';
    }
    
    // Redfish API detection - check content type first
    if (contentType && (contentType.includes('application/json') || contentType.includes('application/xml'))) {
      return 'Redfish';
    }

    // If it's a standard HTTP method, treat as Redfish (unless it's a static asset)
    if (['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'].includes(request.method)) {
      return 'Redfish';
    }
    
    return 'Other';
  },
  
  /**
   * Get content type from headers
   * @param {Object} headers - Request headers
   * @returns {string|null} - Content type value
   */
  getContentType(headers) {
    if (!headers) return null;
    const contentTypeKey = Object.keys(headers).find(
      key => key.toLowerCase() === 'content-type'
    );
    return contentTypeKey ? headers[contentTypeKey] : null;
  },
  
  /**
   * Check if URL is a static asset
   * @param {string} url - Request URL
   * @returns {boolean}
   */
  isStaticAsset(url) {
    const staticExtensions = [
      '.css', '.js', '.jpg', '.jpeg', '.png', '.gif', '.svg',
      '.woff', '.woff2', '.ttf', '.eot', '.ico', '.webp',
      '.mp4', '.webm', '.mp3', '.wav', '.pdf'
    ];
    return staticExtensions.some(ext => url.endsWith(ext));
  },
  
  /**
   * Parse request body based on content type
   * @param {*} requestBody - Raw request body
   * @param {string} contentType - Content type header
   * @returns {string} - Formatted request body
   */
  parseRequestBody(requestBody, contentType) {
    if (!requestBody) return null;
    
    try {
      // Handle FormData
      if (requestBody.formData) {
        return JSON.stringify(requestBody.formData, null, 2);
      }
      
      // Handle raw bytes
      if (requestBody.raw && requestBody.raw.length > 0) {
        const decoder = new TextDecoder('utf-8');
        const bytes = requestBody.raw[0].bytes;
        const text = decoder.decode(new Uint8Array(bytes));
        
        // Try to parse as JSON for pretty printing
        if (contentType && contentType.includes('application/json')) {
          try {
            const json = JSON.parse(text);
            return JSON.stringify(json, null, 2);
          } catch (e) {
            return text;
          }
        }
        
        return text;
      }
      
      // Already a string
      if (typeof requestBody === 'string') {
        if (contentType && contentType.includes('application/json')) {
          try {
            const json = JSON.parse(requestBody);
            return JSON.stringify(json, null, 2);
          } catch (e) {
            return requestBody;
          }
        }
        return requestBody;
      }
      
      return JSON.stringify(requestBody, null, 2);
    } catch (e) {
      console.error('Failed to parse request body:', e);
      return String(requestBody);
    }
  },
  
  /**
   * Format response body for display
   * @param {string} responseBody - Response body text
   * @param {string} contentType - Content type header
   * @returns {string} - Formatted response body
   */
  formatResponseBody(responseBody, contentType) {
    if (!responseBody) return null;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        const json = JSON.parse(responseBody);
        return JSON.stringify(json, null, 2);
      }
    } catch (e) {
      // Not JSON or parsing failed
    }
    
    return responseBody;
  },
  
  /**
   * Get status code category
   * @param {number} statusCode - HTTP status code
   * @returns {string} - Status category (success, redirect, client-error, server-error)
   */
  getStatusCategory(statusCode) {
    if (statusCode >= 200 && statusCode < 300) return 'success';
    if (statusCode >= 300 && statusCode < 400) return 'redirect';
    if (statusCode >= 400 && statusCode < 500) return 'client-error';
    if (statusCode >= 500) return 'server-error';
    return 'unknown';
  }
};

// Make available globally for background scripts
if (typeof window !== 'undefined') {
  window.RequestParser = RequestParser;
}
