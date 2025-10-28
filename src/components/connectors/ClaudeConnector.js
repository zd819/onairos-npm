import React, { Component } from 'react';

class ClaudeConnector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      open: false,
      isConnecting: false,
    };
    this.handleClose = this.handleClose.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.claudeConnect = this.claudeConnect.bind(this);
    this.setConnected = this.setConnected.bind(this);
    this.setDisconnected = this.setDisconnected.bind(this);
  }

  setConnected() {
    this.setState({ connected: true });
    if (this.props.onConnectionChange) {
      this.props.onConnectionChange('Claude', true);
    }
    this.handleClose();
  }

  setDisconnected() {
    this.setState({ connected: false });
    if (this.props.onConnectionChange) {
      this.props.onConnectionChange('Claude', false);
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

  async claudeConnect() {
    // Use the LLM Connector Manager if available, otherwise fallback to old behavior
    const llmManager = this.props.llmConnectorManager;
    
    if (llmManager) {
      // New behavior: Use extension detection
      llmManager.connectToLLM(
        'claude',
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
        console.log('🤖 Opening Claude in new tab (fallback mode)...');
        
        const claudeWindow = window.open('https://claude.ai', '_blank');
        
        if (!claudeWindow) {
          throw new Error('Popup blocked. Please allow popups for this site.');
        }

        setTimeout(() => {
          console.log('✅ Claude connection simulated (fallback)');
          this.setConnected();
          this.setState({ isConnecting: false });
        }, 1000);

      } catch (error) {
        console.error('❌ Claude connection error:', error);
        this.setState({ isConnecting: false });
        alert('Failed to open Claude. Please ensure popups are allowed and try again.');
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
                src="/claude-color.png" 
                alt="Claude" 
                className="w-8 h-8 mr-3"
                onError={(e) => {
                  // Fallback to emoji if image fails to load
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'inline';
                }}
              />
              <span className="text-2xl mr-3" style={{display: 'none'}}>🧠</span>
              <h2 className="text-xl font-bold text-gray-900">
                Connect to Claude
              </h2>
            </div>
            
            <div className="space-y-4 text-gray-700">
              <p>
                This will open Claude in a new tab where you can interact with Anthropic's AI assistant.
              </p>
              
              <div>
                <p className="font-medium mb-2">What you can do with Claude:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Engage in thoughtful, nuanced conversations</li>
                  <li>Get help with analysis and research</li>
                  <li>Work on creative writing projects</li>
                  <li>Receive detailed explanations on complex topics</li>
                  <li>Get coding assistance with safety focus</li>
                </ul>
              </div>
              
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                <p className="text-orange-800 text-sm font-medium">
                  <strong>Note:</strong> Claude will open in a new tab. You can return to this page anytime.
                </p>
              </div>
              
              <p className="text-sm">
                By connecting to Claude, you'll be redirected to{' '}
                <a href="https://claude.ai" className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  claude.ai
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
                onClick={this.claudeConnect}
                disabled={this.state.isConnecting}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {this.state.isConnecting ? 'Opening...' : 'Open Claude'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ClaudeConnector;
