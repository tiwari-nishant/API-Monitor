/**
 * Service Worker for Safari (Manifest V3)
 * Safari-compatible version — no sidePanel, uses popup window instead.
 */

// Import all background scripts
importScripts(
  '../utils/request-parser.js',
  'storage-manager.js',
  'request-interceptor.js',
  'background-safari.js'
);

console.log('Service worker loaded for Safari Manifest V3');

// Handle extension icon click — open the sidebar as a popup window
browser.action.onClicked.addListener((tab) => {
  browser.windows.create({
    url: browser.runtime.getURL('sidebar/sidebar.html'),
    type: 'popup',
    width: 480,
    height: 720
  });
});

// Made with Bob
