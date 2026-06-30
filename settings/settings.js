// settings.js

document.addEventListener('DOMContentLoaded', function() {
  const addRuleBtn = document.getElementById('addRuleBtn');
  
  // Load existing rules when page loads
  loadRules();
  
  // Add rule event listener
  addRuleBtn.addEventListener('click', addRule);
});

function loadRules() {
  chrome.storage.local.get(['rules'], function(result) {
    const rules = result.rules || [];
    displayRules(rules);
  });
}

function displayRules(rules) {
  const container = document.getElementById('rulesContainer');
  
  if (rules.length === 0) {
    container.innerHTML = '<p>No rules defined yet.</p>';
    return;
  }
  
  container.innerHTML = '';
  
  rules.forEach((rule, index) => {
    const ruleElement = document.createElement('div');
    ruleElement.className = 'rule-item';
    
    ruleElement.innerHTML = `
      <strong>Rule ${index + 1}</strong>
      <div class="rule-info">
        <p><strong>Source:</strong> ${rule.sourcePattern}</p>
        <p><strong>Parameter:</strong> ${rule.parameter}</p>
        <p><strong>Target:</strong> ${rule.targetPattern}</p>
      </div>
      <button class="delete-btn" data-index="${index}">Delete</button>
    `;
    
    container.appendChild(ruleElement);
  });
  
  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', function() {
      const index = parseInt(this.getAttribute('data-index'));
      deleteRule(index);
    });
  });
}

function addRule() {
  const sourcePattern = document.getElementById('sourcePattern').value.trim();
  const parameter = document.getElementById('parameter').value.trim();
  const targetPattern = document.getElementById('targetPattern').value.trim();
  
  // Validate inputs
  if (!sourcePattern || !parameter || !targetPattern) {
    alert('Please fill in all fields');
    return;
  }
  
  // Get existing rules
  chrome.storage.local.get(['rules'], function(result) {
    const rules = result.rules || [];
    
    // Create new rule
    const newRule = {
      sourcePattern: sourcePattern,
      parameter: parameter,
      targetPattern: targetPattern
    };
    
    // Add to rules array
    rules.push(newRule);
    
    // Save back to storage
    chrome.storage.local.set({rules: rules}, function() {
      console.log('Rule saved');
      
      // Clear form
      document.getElementById('sourcePattern').value = '';
      document.getElementById('parameter').value = '';
      document.getElementById('targetPattern').value = '';
      
      // Reload rules display
      loadRules();
    });
  });
}

function deleteRule(index) {
  if (!confirm('Are you sure you want to delete this rule?')) {
    return;
  }
  
  chrome.storage.local.get(['rules'], function(result) {
    const rules = result.rules || [];
    
    // Remove rule at specified index
    rules.splice(index, 1);
    
    // Save back to storage
    chrome.storage.local.set({rules: rules}, function() {
      console.log('Rule deleted');
      
      // Reload rules display
      loadRules();
    });
  });
}