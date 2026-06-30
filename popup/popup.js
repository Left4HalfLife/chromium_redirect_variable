// popup.js

document.addEventListener('DOMContentLoaded', function() {
  const redirectBtn = document.getElementById('redirect-btn');
  const urlDisplay = document.getElementById('url-display');
  const statusDiv = document.getElementById('status');
  
  // Get current tab URL
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      const currentUrl = tabs[0].url;
      urlDisplay.textContent = `Current URL:\n${currentUrl}`;
      
      // Check if there's a matching rule for this URL
      checkForMatchingRule(currentUrl);
    }
  });
  
  redirectBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0]) {
        const currentUrl = tabs[0].url;
        redirectToTransformedUrl(currentUrl);
      }
    });
  });
});

function checkForMatchingRule(currentUrl) {
  chrome.storage.local.get(['rules'], function(result) {
    const rules = result.rules || [];
    
    for (let rule of rules) {
      if (matchesSourcePattern(currentUrl, rule.sourcePattern)) {
        // Show visual indication that redirection is available
        document.body.classList.add('glow');
        redirectBtn.disabled = false;
        statusDiv.textContent = 'Redirection available';
        return;
      }
    }
    
    // No matching rule found
    statusDiv.textContent = 'No matching rule found';
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

function redirectToTransformedUrl(currentUrl) {
  chrome.storage.local.get(['rules'], function(result) {
    const rules = result.rules || [];
    
    for (let rule of rules) {
      if (matchesSourcePattern(currentUrl, rule.sourcePattern)) {
        // Extract parameter from current URL
        const extractedValue = extractParameter(currentUrl, rule.parameter);
        
        if (extractedValue) {
          // Transform URL using target pattern
          const transformedUrl = transformUrl(rule.targetPattern, rule.parameter, extractedValue);
          
          // Redirect to transformed URL
          chrome.tabs.update({url: transformedUrl});
          return;
        }
      }
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