// background.js

// Create context menu items when extension is installed
chrome.runtime.onInstalled.addListener(function() {
  chrome.contextMenus.create({
    id: "settings",
    title: "Open Settings",
    contexts: ["action"]
  });
  
  chrome.contextMenus.create({
    id: "preview",
    title: "Preview Redirect URL",
    contexts: ["action"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "settings") {
    chrome.runtime.openOptionsPage();
  } else if (info.menuItemId === "preview") {
    previewRedirectUrl(tab.url);
  }
});

// Listen for messages from popup or other parts of the extension
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "checkForRule") {
    checkForMatchingRule(request.url, sendResponse);
    return true; // Keep message channel open for async response
  }
});

function checkForMatchingRule(currentUrl, callback) {
  chrome.storage.local.get(['rules'], function(result) {
    const rules = result.rules || [];
    let matchingRule = null;
    
    for (let rule of rules) {
      if (matchesSourcePattern(currentUrl, rule.sourcePattern)) {
        matchingRule = rule;
        break;
      }
    }
    
    callback({
      hasMatchingRule: !!matchingRule,
      rule: matchingRule
    });
  });
}

function matchesSourcePattern(currentUrl, sourcePattern) {
  try {
    const urlObj = new URL(currentUrl);
    const patternObj = new URL(sourcePattern);
    
    // Match domain and path
    if (urlObj.hostname !== patternObj.hostname) {
      return false;
    }
    
    // For simplicity, we'll check if the source pattern is a substring of current URL
    // This can be enhanced for more sophisticated pattern matching
    return currentUrl.includes(sourcePattern);
  } catch (e) {
    // If URL parsing fails, treat as simple string match
    return currentUrl.includes(sourcePattern);
  }
}

function previewRedirectUrl(currentUrl) {
  chrome.storage.local.get(['rules'], function(result) {
    const rules = result.rules || [];
    let previewUrl = null;
    
    for (let rule of rules) {
      if (matchesSourcePattern(currentUrl, rule.sourcePattern)) {
        // Extract parameter from current URL
        const extractedValue = extractParameter(currentUrl, rule.parameter);
        
        if (extractedValue) {
          // Transform URL using target pattern
          previewUrl = transformUrl(rule.targetPattern, rule.parameter, extractedValue);
          break;
        }
      }
    }
    
    if (previewUrl) {
      // Show notification with preview URL
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-128.png",
        title: "URL Redirector Preview",
        message: `Would redirect to:\n${previewUrl}`
      });
    } else {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icons/icon-128.png",
        title: "URL Redirector",
        message: "No matching rule found for this URL"
      });
    }
  });
}

function extractParameter(url, parameterName) {
  try {
    const urlObj = new URL(url);
    const params = new URLSearchParams(urlObj.search);
    
    if (params.has(parameterName)) {
      return params.get(parameterName);
    }
    
    // If not found in query string, check if it's in the path
    const pathParts = urlObj.pathname.split('/');
    for (let i = 0; i < pathParts.length; i++) {
      if (pathParts[i] === parameterName && i + 1 < pathParts.length) {
        return pathParts[i + 1];
      }
    }
    
    return null;
  } catch (e) {
    console.error('Error extracting parameter:', e);
    return null;
  }
}

function transformUrl(targetPattern, parameterName, value) {
  // Replace the placeholder with the extracted value
  return targetPattern.replace(`{${parameterName}}`, value);
}