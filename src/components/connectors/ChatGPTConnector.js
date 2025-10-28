import React, { Component } from 'react';
import { useLLMConnectorManager } from '../LLMConnectorManager';

class ChatGPTConnector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      open: false,
      isConnecting: false,
    };
    this.handleClose = this.handleClose.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.chatGPTConnect = this.chatGPTConnect.bind(this);
    this.setConnected = this.setConnected.bind(this);
    this.setDisconnected = this.setDisconnected.bind(this);
  }

  setConnected() {
    this.setState({ connected: true });
    if (this.props.onConnectionChange) {
      this.props.onConnectionChange('ChatGPT', true);
    }
    this.handleClose();
  }

  setDisconnected() {
    this.setState({ connected: false });
    if (this.props.onConnectionChange) {
      this.props.onConnectionChange('ChatGPT', false);
    }
    this.handleClose();
  }

  handleOpen() {
    this.setState({ open: true });
  }

  handleClose() {
    this.setState({ open: false });
    if (this.props.onClose) {
      this.props.onClose();
    }
  }

  async chatGPTConnect() {
    // Use the LLM Connector Manager if available, otherwise fallback to old behavior
    const llmManager = this.props.llmConnectorManager;
    
    if (llmManager) {
      // New behavior: Use extension detection
      llmManager.connectToLLM(
        'chatgpt',
        (platform) => {
          // Success callback
          console.log(`✅ ${platform} connected via extension`);
          this.setConnected();
        },
        (platform, error) => {
          // Error callback
          console.error(`❌ ${platform} connection error:`, error);
          alert(`Failed to connect to ${platform}. ${error}`);
        }
      );
    } else {
      // Fallback: Original behavior for backward compatibility
      this.setState({ isConnecting: true });
      
      try {
        console.log('🤖 Opening ChatGPT in new tab (fallback mode)...');
        
        const chatGPTWindow = window.open('https://chatgpt.com', '_blank');
        
        if (!chatGPTWindow) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        setTimeout(() => {
          console.log('✅ ChatGPT connection simulated (fallback)');
          this.setConnected();
          this.setState({ isConnecting: false });
        }, 1000);

      } catch (error) {
        console.error('❌ ChatGPT connection error:', error);
        this.setState({ isConnecting: false });
        alert('Failed to open ChatGPT. Please ensure popups are allowed and try again.');
      }
    }
  }

  render() {
    const { open = this.props.open || this.state.open } = this.props;
    
    if (!open) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <img 
                src="/chatgpt-icon.png" 
                alt="ChatGPT" 
                className="w-8 h-8 mr-3"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
              <span className="text-2xl mr-3" style={{display: 'none'}}>🤖</span>
              <h2 className="text-xl font-bold text-gray-900">
                Connect to ChatGPT
              </h2>
            </div>
            
            <div className="space-y-4 text-gray-700">
              <p>
                This will open ChatGPT in a new tab where you can interact with the AI assistant.
              </p>
              
              <div>
                <p className="font-medium mb-2">What you can do with ChatGPT:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Ask questions and get intelligent responses</li>
                  <li>Get help with writing and editing</li>
                  <li>Brainstorm ideas and solutions</li>
                  <li>Learn about various topics</li>
                  <li>Get coding assistance</li>
                </ul>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm font-medium">
                  <strong>Note:</strong> ChatGPT will open in a new tab. You can return to this page anytime.
                </p>
              </div>
              
              <p className="text-sm">
                By connecting to ChatGPT, you'll be redirected to{' '}
                <a href="https://chatgpt.com" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  chatgpt.com
                </a>
              </p>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={this.handleClose}
                disabled={this.state.isConnecting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={this.chatGPTConnect}
                disabled={this.state.isConnecting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {this.state.isConnecting ? 'Opening...' : 'Open ChatGPT'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ChatGPTConnector;
