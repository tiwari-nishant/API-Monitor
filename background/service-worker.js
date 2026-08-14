/**
 * Service Worker for Manifest V3
 * This wraps the existing background scripts for Chrome compatibility
 */

// Import all background scripts
importScripts(
  '../utils/request-parser.js',
  'storage-manager.js',
  'request-interceptor.js',
  'background.js'
);

console.log('Service worker loaded for Chrome Manifest V3');

// Handle extension icon click to open sidebar
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});

// Made with Bob
