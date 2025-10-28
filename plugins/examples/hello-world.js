// Hello World Plugin - Simple test plugin

module.exports = {
  id: 'hello-world',
  title: 'Hello World',
  category: 'custom',
  icon: '👋',
  description: 'A simple test plugin that outputs "Hello World!"',
  
  inputs: ['trigger'],
  outputs: ['string', 'trigger'],
  
  params: {
    name: 'World'
  },
  
  paramConfig: {
    name: {
      type: 'text',
      label: 'Name',
      placeholder: 'Enter a name...'
    }
  },
  
  async execute(node, inputData, context) {
    try {
      // Create greeting
      const greeting = `Hello ${node.params.name}!`;
      
      // Set output
      node.outputData = greeting;
      
      // Show message
      context.showMessage(greeting, 'success');
      
      console.log('Hello World plugin executed:', greeting);
      
      return true;
      
    } catch (error) {
      context.showMessage(`Hello World error: ${error.message}`, 'error');
      return false;
    }
  },
  
  validate(node) {
    if (!node.params.name || node.params.name.trim() === '') {
      return 'Name cannot be empty';
    }
    return null;
  }
};
