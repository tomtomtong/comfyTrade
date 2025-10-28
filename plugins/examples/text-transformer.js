// Text Transformer Plugin
// Transforms text with various operations

module.exports = {
  id: 'text-transformer',
  title: 'Text Transformer',
  category: 'custom',
  icon: '🔄',
  description: 'Transform text with various operations (uppercase, lowercase, reverse, capitalize)',
  
  inputs: ['trigger', 'string'],
  outputs: ['string', 'trigger'],
  
  params: {
    operation: 'uppercase',
    prefix: '',
    suffix: ''
  },
  
  paramConfig: {
    operation: {
      type: 'select',
      label: 'Operation',
      options: [
        { value: 'uppercase', label: 'UPPERCASE' },
        { value: 'lowercase', label: 'lowercase' },
        { value: 'reverse', label: 'Reverse' },
        { value: 'capitalize', label: 'Capitalize' },
        { value: 'title', label: 'Title Case' }
      ]
    },
    prefix: {
      type: 'text',
      label: 'Prefix',
      placeholder: 'Text to add before...'
    },
    suffix: {
      type: 'text',
      label: 'Suffix',
      placeholder: 'Text to add after...'
    }
  },
  
  async execute(node, inputData, context) {
    try {
      let text = String(inputData || '');
      
      // Apply operation
      switch (node.params.operation) {
        case 'uppercase':
          text = text.toUpperCase();
          break;
        case 'lowercase':
          text = text.toLowerCase();
          break;
        case 'reverse':
          text = text.split('').reverse().join('');
          break;
        case 'capitalize':
          text = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
          break;
        case 'title':
          text = text.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ');
          break;
      }
      
      // Add prefix/suffix
      text = node.params.prefix + text + node.params.suffix;
      
      // Set output
      node.outputData = text;
      
      return true;
      
    } catch (error) {
      context.showMessage(`Text Transformer error: ${error.message}`, 'error');
      return false;
    }
  },
  
  validate(node) {
    if (!node.params.operation) {
      return 'Operation is required';
    }
    return null;
  }
};
