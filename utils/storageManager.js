// storageManager.js

class StorageManager {
  static async getRules() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['rules'], function(result) {
        resolve(result.rules || []);
      });
    });
  }
  
  static async saveRules(rules) {
    return new Promise((resolve) => {
      chrome.storage.local.set({rules: rules}, function() {
        resolve();
      });
    });
  }
  
  static async addRule(rule) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['rules'], function(result) {
        const rules = result.rules || [];
        rules.push(rule);
        chrome.storage.local.set({rules: rules}, function() {
          resolve();
        });
      });
    });
  }
  
  static async deleteRule(index) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['rules'], function(result) {
        const rules = result.rules || [];
        rules.splice(index, 1);
        chrome.storage.local.set({rules: rules}, function() {
          resolve();
        });
      });
    });
  }
  
  static async checkForMatchingRule(url) {
    return new Promise((resolve) => {
      chrome.storage.local.get(['rules'], function(result) {
        const rules = result.rules || [];
        let matchingRule = null;
        
        for (let rule of rules) {
          if (this.matchesSourcePattern(url, rule.sourcePattern)) {
            matchingRule = rule;
            break;
          }
        }
        
        resolve({
          hasMatchingRule: !!matchingRule,
          rule: matchingRule
        });
      });
    });
  }
  
  static matchesSourcePattern(currentUrl, sourcePattern) {
    try {
      const urlObj = new URL(currentUrl);
      const patternObj = new URL(sourcePattern);
      
      // Match domain and path
      if (urlObj.hostname !== patternObj.hostname) {
        return false;
      }
      
      // For simplicity, we'll check if the source pattern is a substring of current URL
      return currentUrl.includes(sourcePattern);
    } catch (e) {
      // If URL parsing fails, treat as simple string match
      return currentUrl.includes(sourcePattern);
    }
  }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = StorageManager;
}