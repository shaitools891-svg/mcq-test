#!/usr/bin/env node
// Quick test for notificationUtils

const fs = require('fs');
const path = require('path');

// Mock localStorage - since we're in Node.js
const localStorage = {
  _data: {},
  getItem: function(key) { return this._data[key] || null; },
  setItem: function(key, value) { this._data[key] = value; },
  removeItem: function(key) { delete this._data[key]; }
};

global.localStorage = localStorage;
global.navigator = { vibrate: () => {} };
global.window = { addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => {} };
global.document = { documentElement: { classList: { add: () => {}, remove: () => {} } } };

// Add this to fix module issues
const { fileURLToPath } = require('url');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('=== Testing notificationUtils ===');
  
  // Try to import module with dynamic import
  try {
    const module = await import('./src/utils/notificationUtils.ts');
    
    console.log('notificationUtils imported successfully');
    
    // Test settings
    console.log('Notification settings:', module.getNotificationSettings());
    
    // Log the functions
    console.log('Available functions:', Object.keys(module));
    
  } catch (error) {
    console.error('Error importing module:', error);
  }
}

main();
