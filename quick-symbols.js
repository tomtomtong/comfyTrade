// Quick Symbols Component - Reusable quick symbol buttons
class QuickSymbols {
  /**
   * Create quick symbol buttons for any input field
   * @param {HTMLElement} container - Container element to append buttons to
   * @param {Function} onSymbolClick - Callback function when symbol is clicked, receives symbol string
   * @param {Object} options - Optional configuration
   */
  static create(container, onSymbolClick, options = {}) {
    const {
      className = 'quick-symbols',
      buttonClass = 'quick-symbol-btn',
      symbols = AppConfig.getQuickSymbols()
    } = options;
    
    // Create wrapper div
    const wrapper = document.createElement('div');
    wrapper.className = className;
    
    // Create button for each symbol
    symbols.forEach(symbol => {
      const btn = document.createElement('button');
      btn.className = buttonClass;
      btn.textContent = symbol;
      btn.dataset.symbol = symbol;
      btn.type = 'button'; // Prevent form submission
      
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSymbolClick(symbol);
      });
      
      wrapper.appendChild(btn);
    });
    
    container.appendChild(wrapper);
    return wrapper;
  }
  
  /**
   * Create quick symbols for a symbol input component
   * @param {HTMLElement} container - Container element
   * @param {Object} symbolInput - SymbolInput instance
   */
  static createForSymbolInput(container, symbolInput) {
    return this.create(container, (symbol) => {
      symbolInput.setValue(symbol);
    });
  }
  
  /**
   * Update existing quick symbol buttons with new symbols
   * @param {HTMLElement} container - Container with quick-symbols div
   */
  static update(container) {
    const wrapper = container.querySelector('.quick-symbols');
    if (wrapper) {
      // Store the click handler from first button if exists
      const firstBtn = wrapper.querySelector('.quick-symbol-btn');
      let clickHandler = null;
      
      if (firstBtn) {
        // Get the onclick behavior by checking dataset
        const symbolInput = container.querySelector('.symbol-input-wrapper');
        if (symbolInput) {
          clickHandler = (symbol) => {
            // Try to find and trigger the symbol input
            const input = symbolInput.querySelector('input');
            if (input) {
              input.value = symbol;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          };
        }
      }
      
      // Clear and rebuild
      wrapper.innerHTML = '';
      const symbols = AppConfig.getQuickSymbols();
      
      symbols.forEach(symbol => {
        const btn = document.createElement('button');
        btn.className = 'quick-symbol-btn';
        btn.textContent = symbol;
        btn.dataset.symbol = symbol;
        btn.type = 'button';
        
        if (clickHandler) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            clickHandler(symbol);
          });
        }
        
        wrapper.appendChild(btn);
      });
    }
  }
}
