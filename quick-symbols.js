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
   * @param {Function} onSymbolClick - Optional click handler, will try to preserve existing if not provided
   */
  static update(container, onSymbolClick = null) {
    const wrapper = container.querySelector('.quick-symbols');
    if (wrapper) {
      let clickHandler = onSymbolClick;
      
      // If no click handler provided, try to use the global symbol input
      if (!clickHandler && window.tradeSymbolInput) {
        clickHandler = (symbol) => {
          window.tradeSymbolInput.setValue(symbol);
          // Also trigger price update if the function exists
          if (typeof updateCurrentPrice === 'function') {
            updateCurrentPrice(symbol);
          }
        };
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
