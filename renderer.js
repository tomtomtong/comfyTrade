// Main UI Controller
let isConnected = false;
let nodeEditor = null;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeNodeEditor();
  setupEventListeners();
});

function initializeNodeEditor() {
  const canvas = document.getElementById('nodeCanvas');
  nodeEditor = new NodeEditor(canvas);
  
  // Add some example nodes
  nodeEditor.addNode('market-data', 100, 100);
  nodeEditor.addNode('indicator-ma', 350, 100);
  nodeEditor.addNode('compare', 600, 150);
  nodeEditor.addNode('trade-signal', 850, 150);
}

function setupEventListeners() {
  // Toolbar buttons
  document.getElementById('connectBtn').addEventListener('click', showConnectionModal);
  document.getElementById('executeGraphBtn').addEventListener('click', executeNodeStrategy);
  document.getElementById('saveGraphBtn').addEventListener('click', saveGraph);
  document.getElementById('loadGraphBtn').addEventListener('click', loadGraph);
  document.getElementById('clearGraphBtn').addEventListener('click', clearGraph);
  
  // Modal buttons
  document.getElementById('confirmConnectBtn').addEventListener('click', handleConnect);
  document.getElementById('cancelConnectBtn').addEventListener('click', hideConnectionModal);
  
  // Account refresh
  document.getElementById('refreshAccountBtn').addEventListener('click', handleRefreshAccount);
  
  // Node palette buttons
  document.querySelectorAll('.node-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const type = e.target.dataset.type;
      const canvas = document.getElementById('nodeCanvas');
      const rect = canvas.getBoundingClientRect();
      const x = rect.width / 2 - 90 + Math.random() * 100;
      const y = rect.height / 2 - 40 + Math.random() * 100;
      nodeEditor.addNode(type, x, y);
    });
  });
  
  // Node selection handler - track changes to avoid unnecessary updates
  let lastSelectedNode = null;
  setInterval(() => {
    if (nodeEditor.selectedNode !== lastSelectedNode) {
      lastSelectedNode = nodeEditor.selectedNode;
      updatePropertiesPanel(nodeEditor.selectedNode);
    }
  }, 100);
}

// Connection Modal
function showConnectionModal() {
  document.getElementById('connectionModal').classList.add('show');
}

function hideConnectionModal() {
  document.getElementById('connectionModal').classList.remove('show');
}

async function handleConnect() {
  const server = document.getElementById('server').value;
  const port = document.getElementById('port').value;

  showMessage('Connecting to MT5...', 'info');
  hideConnectionModal();

  const result = await window.mt5API.connect({ server, port });

  if (result.success) {
    isConnected = true;
    document.getElementById('connectionStatus').textContent = 'Connected';
    document.getElementById('connectionStatus').className = 'status connected';
    showMessage('Connected to MT5 successfully!', 'success');
    
    handleRefreshAccount();
    handleRefreshPositions();
    
    // Start auto-refresh
    startAutoRefresh();
  } else {
    showMessage('Connection failed: ' + result.error, 'error');
  }
}

// Account Info
async function handleRefreshAccount() {
  if (!isConnected) {
    showMessage('Please connect to MT5 first', 'error');
    return;
  }

  const result = await window.mt5API.getAccountInfo();

  if (result.success) {
    const data = result.data;
    document.getElementById('balance').textContent = '$' + data.balance.toFixed(2);
    document.getElementById('equity').textContent = '$' + data.equity.toFixed(2);
    
    const profitEl = document.getElementById('profit');
    profitEl.textContent = '$' + data.profit.toFixed(2);
    profitEl.className = 'profit ' + (data.profit >= 0 ? 'positive' : 'negative');
  }
}

async function handleRefreshPositions() {
  if (!isConnected) return;

  const result = await window.mt5API.getPositions();

  if (result.success) {
    const positions = result.data;
    const container = document.getElementById('positionsList');

    if (positions.length === 0) {
      container.innerHTML = '<p class="no-data">No open positions</p>';
    } else {
      container.innerHTML = positions.map(pos => `
        <div class="position-item ${pos.type.toLowerCase()}">
          <div class="position-header">
            <span>${pos.symbol} ${pos.type}</span>
            <span class="${pos.profit >= 0 ? 'profit positive' : 'profit negative'}">
              $${pos.profit.toFixed(2)}
            </span>
          </div>
          <div class="position-details">
            Vol: ${pos.volume} | Entry: ${pos.open_price.toFixed(5)} | Current: ${pos.current_price.toFixed(5)}
          </div>
          <div class="position-details">
            SL: ${pos.stop_loss > 0 ? pos.stop_loss.toFixed(5) : 'None'} | TP: ${pos.take_profit > 0 ? pos.take_profit.toFixed(5) : 'None'}
          </div>
          <div class="position-actions">
            <button class="btn btn-small btn-primary" onclick="showModifyModal(${pos.ticket}, ${pos.stop_loss}, ${pos.take_profit})">Modify</button>
            <button class="btn btn-small btn-danger" onclick="closePosition(${pos.ticket})">Close</button>
          </div>
        </div>
      `).join('');
    }
  }
}

async function closePosition(ticket) {
  if (!confirm('Are you sure you want to close this position?')) {
    return;
  }

  showMessage('Closing position...', 'info');

  const result = await window.mt5API.closePosition(ticket);

  if (result.success && result.data.success) {
    showMessage('Position closed successfully!', 'success');
    handleRefreshAccount();
    handleRefreshPositions();
  } else {
    showMessage('Failed to close position: ' + (result.data?.error || result.error), 'error');
  }
}

function showModifyModal(ticket, currentSL, currentTP) {
  const modal = document.getElementById('modifyModal');
  if (!modal) {
    createModifyModal();
  }
  
  document.getElementById('modifyTicket').value = ticket;
  document.getElementById('modifyStopLoss').value = currentSL > 0 ? currentSL : '';
  document.getElementById('modifyTakeProfit').value = currentTP > 0 ? currentTP : '';
  document.getElementById('modifyModal').classList.add('show');
}

function hideModifyModal() {
  document.getElementById('modifyModal').classList.remove('show');
}

async function handleModifyPosition() {
  const ticket = parseInt(document.getElementById('modifyTicket').value);
  const slValue = document.getElementById('modifyStopLoss').value;
  const tpValue = document.getElementById('modifyTakeProfit').value;
  
  const stopLoss = slValue ? parseFloat(slValue) : 0;
  const takeProfit = tpValue ? parseFloat(tpValue) : 0;

  hideModifyModal();
  showMessage('Modifying position...', 'info');

  const result = await window.mt5API.modifyPosition(ticket, stopLoss, takeProfit);

  if (result.success && result.data.success) {
    showMessage('Position modified successfully!', 'success');
    handleRefreshPositions();
  } else {
    showMessage('Failed to modify position: ' + (result.data?.error || result.error), 'error');
  }
}

function createModifyModal() {
  const modalHTML = `
    <div id="modifyModal" class="modal">
      <div class="modal-content">
        <h2>Modify Position</h2>
        <input type="hidden" id="modifyTicket">
        <div class="form-group">
          <label>Stop Loss:</label>
          <input type="number" id="modifyStopLoss" step="0.00001" placeholder="0 for none">
        </div>
        <div class="form-group">
          <label>Take Profit:</label>
          <input type="number" id="modifyTakeProfit" step="0.00001" placeholder="0 for none">
        </div>
        <div class="modal-actions">
          <button id="confirmModifyBtn" class="btn btn-primary">Modify</button>
          <button id="cancelModifyBtn" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  document.getElementById('confirmModifyBtn').addEventListener('click', handleModifyPosition);
  document.getElementById('cancelModifyBtn').addEventListener('click', hideModifyModal);
}

// Make functions globally available
window.closePosition = closePosition;
window.showModifyModal = showModifyModal;

// Node Strategy Execution
async function executeNodeStrategy() {
  if (!isConnected) {
    showMessage('Please connect to MT5 first', 'error');
    return;
  }

  const graph = nodeEditor.exportGraph();
  
  if (graph.nodes.length === 0) {
    showMessage('Please add nodes to the canvas first', 'error');
    return;
  }

  showMessage('Executing node-based strategy...', 'info');

  const result = await window.mt5API.executeNodeStrategy(graph);

  if (result.success) {
    showMessage(`Strategy executed! Processed ${result.data.executedNodes} nodes`, 'success');
    handleRefreshAccount();
    handleRefreshPositions();
  } else {
    showMessage('Strategy execution failed: ' + result.error, 'error');
  }
}

// Properties Panel
function updatePropertiesPanel(node) {
  const panel = document.getElementById('nodeProperties');
  
  if (!node) {
    panel.innerHTML = '<p class="no-selection">Select a node to edit properties</p>';
    return;
  }
  
  const paramEntries = Object.entries(node.params);
  
  if (paramEntries.length === 0) {
    panel.innerHTML = `
      <div class="property-item">
        <label>Node Type:</label>
        <input type="text" value="${node.title}" disabled>
      </div>
      <p class="no-selection">This node has no parameters</p>
      <div class="property-actions">
        <button class="btn btn-danger btn-small">Delete Node</button>
      </div>
    `;
    return;
  }

  panel.innerHTML = `
    <div class="property-item">
      <label>Node Type:</label>
      <input type="text" value="${node.title}" disabled>
    </div>
    ${paramEntries.map(([key, value]) => `
      <div class="property-item">
        <label>${key}:</label>
        <input type="text" 
               value="${value}" 
               data-param="${key}"
               onchange="updateNodeParam('${key}', this.value)">
      </div>
    `).join('')}
    <div class="property-actions">
      <button class="btn btn-danger btn-small">Delete Node</button>
    </div>
  `;
}

// Make updatePropertiesPanel available globally for node-editor.js
window.updatePropertiesPanel = updatePropertiesPanel;

window.updateNodeParam = function(key, value) {
  if (nodeEditor.selectedNode) {
    nodeEditor.selectedNode.params[key] = value;
  }
};

window.deleteSelectedNode = function() {
  if (nodeEditor && nodeEditor.selectedNode) {
    nodeEditor.deleteSelectedNode();
    showMessage('Node deleted', 'info');
  }
};

// Add event delegation for delete button to prevent issues with dynamic content
document.addEventListener('click', (e) => {
  if (e.target.matches('.property-actions .btn-danger')) {
    e.preventDefault();
    window.deleteSelectedNode();
  }
});

// Graph Management
function saveGraph() {
  const graph = nodeEditor.exportGraph();
  const json = JSON.stringify(graph, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = 'strategy-' + Date.now() + '.json';
  a.click();
  
  showMessage('Strategy saved!', 'success');
}

function loadGraph() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const graph = JSON.parse(event.target.result);
        nodeEditor.importGraph(graph);
        showMessage('Strategy loaded!', 'success');
      } catch (error) {
        showMessage('Failed to load strategy: ' + error.message, 'error');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

function clearGraph() {
  if (confirm('Clear all nodes? This cannot be undone.')) {
    nodeEditor.clear();
    document.getElementById('nodeProperties').innerHTML = 
      '<p class="no-selection">Select a node to edit properties</p>';
    showMessage('Canvas cleared', 'info');
  }
}

// Auto-refresh
let refreshInterval = null;

function startAutoRefresh() {
  if (refreshInterval) return;
  
  refreshInterval = setInterval(() => {
    if (isConnected) {
      handleRefreshAccount();
      handleRefreshPositions();
    }
  }, 5000);
}

// Message System
function showMessage(text, type) {
  const messageBox = document.getElementById('messageBox');
  messageBox.textContent = text;
  messageBox.className = `message-box show ${type}`;

  setTimeout(() => {
    messageBox.className = 'message-box';
  }, 3000);
}
