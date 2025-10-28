// Delay Node Plugin
// Add a delay before continuing execution

module.exports = {
  id: 'delay-node',
  title: 'Delay',
  category: 'custom',
  icon: '⏱️',
  description: 'Add a delay before continuing execution',
  
  inputs: ['trigger'],
  outputs: ['trigger'],
  
  params: {
    delay: 1000,
    unit: 'milliseconds'
  },
  
  paramConfig: {
    delay: {
      type: 'number',
      label: 'Delay',
      min: 0,
      step: 100,
      placeholder: '1000'
    },
    unit: {
      type: 'select',
      label: 'Unit',
      options: [
        { value: 'milliseconds', label: 'Milliseconds' },
        { value: 'seconds', label: 'Seconds' },
        { value: 'minutes', label: 'Minutes' }
      ]
    }
  },
  
  async execute(node, inputData, context) {
    try {
      let delayMs = parseInt(node.params.delay) || 0;
      
      // Convert to milliseconds
      switch (node.params.unit) {
        case 'seconds':
          delayMs *= 1000;
          break;
        case 'minutes':
          delayMs *= 60000;
          break;
      }
      
      // Show message
      context.showMessage(`Delaying for ${node.params.delay} ${node.params.unit}...`, 'info');
      
      // Wait
      await new Promise(resolve => setTimeout(resolve, delayMs));
      
      return true;
      
    } catch (error) {
      context.showMessage(`Delay error: ${error.message}`, 'error');
      return false;
    }
  },
  
  validate(node) {
    const delay = parseInt(node.params.delay);
    if (isNaN(delay) || delay < 0) {
      return 'Delay must be a positive number';
    }
    return null;
  }
};
