// Math Calculator Plugin
// Perform mathematical operations on numeric inputs

module.exports = {
  id: 'math-calculator',
  title: 'Math Calculator',
  category: 'custom',
  icon: '🔢',
  description: 'Perform mathematical operations on numbers',
  
  inputs: ['trigger', 'string'],
  outputs: ['string', 'trigger'],
  
  params: {
    operation: 'add',
    value: 0,
    decimals: 2
  },
  
  paramConfig: {
    operation: {
      type: 'select',
      label: 'Operation',
      options: [
        { value: 'add', label: 'Add (+)' },
        { value: 'subtract', label: 'Subtract (-)' },
        { value: 'multiply', label: 'Multiply (×)' },
        { value: 'divide', label: 'Divide (÷)' },
        { value: 'power', label: 'Power (^)' },
        { value: 'sqrt', label: 'Square Root (√)' },
        { value: 'abs', label: 'Absolute Value' },
        { value: 'round', label: 'Round' },
        { value: 'floor', label: 'Floor' },
        { value: 'ceil', label: 'Ceiling' }
      ]
    },
    value: {
      type: 'number',
      label: 'Value',
      placeholder: '0',
      step: 0.01
    },
    decimals: {
      type: 'number',
      label: 'Decimal Places',
      min: 0,
      max: 10,
      step: 1
    }
  },
  
  async execute(node, inputData, context) {
    try {
      // Parse input as number
      let num = parseFloat(inputData);
      
      if (isNaN(num)) {
        context.showMessage('Math Calculator: Input is not a valid number', 'warning');
        node.outputData = 'NaN';
        return false;
      }
      
      const value = parseFloat(node.params.value);
      let result;
      
      // Perform operation
      switch (node.params.operation) {
        case 'add':
          result = num + value;
          break;
        case 'subtract':
          result = num - value;
          break;
        case 'multiply':
          result = num * value;
          break;
        case 'divide':
          if (value === 0) {
            context.showMessage('Math Calculator: Division by zero', 'error');
            node.outputData = 'Error: Division by zero';
            return false;
          }
          result = num / value;
          break;
        case 'power':
          result = Math.pow(num, value);
          break;
        case 'sqrt':
          if (num < 0) {
            context.showMessage('Math Calculator: Cannot take square root of negative number', 'error');
            node.outputData = 'Error: Negative square root';
            return false;
          }
          result = Math.sqrt(num);
          break;
        case 'abs':
          result = Math.abs(num);
          break;
        case 'round':
          result = Math.round(num);
          break;
        case 'floor':
          result = Math.floor(num);
          break;
        case 'ceil':
          result = Math.ceil(num);
          break;
        default:
          result = num;
      }
      
      // Format result
      const decimals = parseInt(node.params.decimals) || 2;
      result = result.toFixed(decimals);
      
      // Set output
      node.outputData = result;
      
      return true;
      
    } catch (error) {
      context.showMessage(`Math Calculator error: ${error.message}`, 'error');
      node.outputData = `Error: ${error.message}`;
      return false;
    }
  }
};
