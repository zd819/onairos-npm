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

    // Bookmarklet code: fully inline so it works with ChatGPT CSP (no external script load)
    const bookmarkletCode = `javascript:(function(){try{var ok=window.confirm('Allow Onairos to export your last 10 ChatGPT conversations to your Onairos account?');if(!ok){console.log('❌ Onairos ChatGPT export cancelled by user.');return;}console.log('✅ Onairos ChatGPT export consent granted. (Demo bookmarklet – real export happens via the browser extension / backend integration.)');}catch(e){console.error('Onairos ChatGPT bookmarklet error:',e);}})();`;
    
    return (
      <>
        <style>{`
          @keyframes gentlePulse {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(244, 114, 182, 0.18),
                          0 0 0 0 rgba(129, 140, 248, 0.16);
            }
            50% {
              box-shadow: 0 0 0 4px rgba(244, 114, 182, 0),
                          0 0 0 8px rgba(129, 140, 248, 0);
            }
          }
          .bookmarklet-button {
            background: linear-gradient(to right, #f9a8d4, #a5b4fc);
          }
          @keyframes fadeInScale {
            0% { opacity: 0; transform: translateY(6px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .chatgpt-modal-card {
            animation: fadeInScale 180ms ease-out;
          }
        `}</style>
        {/* Overlay: transparent so Delphi page + main modal stay visible */}
        <div className="fixed inset-0 flex items-center justify-center z-50">
          {/* Outer card (white) */}
          <div className="max-w-md w-full mx-4">
            <div className="chatgpt-modal-card bg-white/95 rounded-[40px] shadow-xl border border-rose-100/70 backdrop-blur-sm">
              {/* Inner gradient panel like OG screenshot */}
              <div className="m-4 rounded-[28px] bg-gradient-to-b from-rose-50 via-pink-50 to-sky-50 px-5 py-5">
                {/* Close Button */}
                <button
                  onClick={this.handleClose}
                  className="absolute right-4 top-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Title */}
                <h2 className="text-2xl font-semibold text-gray-900 mb-1.5 pr-8">
                  Bring in your ChatGPT memories
                </h2>
                
                <p className="text-gray-500 text-sm mb-4">
                  Follow these quick steps to let Onairos extract your recent conversations:
                </p>

                {/* Step 1: Add the magic button */}
                <div className="mb-4">
                  <p className="text-gray-700 font-medium mb-1.5">
                    Step 1: Add the magic button
                  </p>
                  <p className="text-gray-500 text-xs mb-2.5">
                    Drag this glowing button to your bookmarks bar. It only runs when you click it on ChatGPT.
                  </p>
                  <div className="relative">
                    <div className="absolute inset-0 rounded-[999px]" style={{ animation: 'gentlePulse 2.2s ease-in-out infinite' }}></div>
                    <a
                      href={bookmarkletCode}
                      draggable="true"
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', bookmarkletCode);
                        e.dataTransfer.effectAllowed = 'copy';
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        alert('Please drag this button to your bookmarks bar instead of clicking it.');
                      }}
                      className="bookmarklet-button relative block w-full px-4 py-2 rounded-full font-medium text-white text-center cursor-move select-none transition-transform hover:scale-[1.01]"
                      style={{
                        boxShadow: '0 8px 24px 0 rgba(236, 72, 153, 0.32)'
                      }}
                    >
                      <span className="text-lg mr-1.5">✨</span>
                      <span className="text-sm">Onairos ChatGPT Link</span>
                    </a>
                  </div>
                </div>

                {/* Step 2: Open ChatGPT */}
                <div className="mb-4">
                  <p className="text-gray-700 font-medium mb-1.5">
                    Step 2: Open ChatGPT
                  </p>
                  <p className="text-gray-500 text-xs mb-2">
                    Click the button below to open ChatGPT in a new tab. We'll stay on this window so you can follow along.
                  </p>
                  <button
                    onClick={() => {
                      window.open('https://chatgpt.com', '_blank');
                    }}
                    className="w-full px-4 py-2 rounded-full font-medium text-white text-sm transition-transform hover:scale-[1.01]"
                    style={{
                      background: 'linear-gradient(to right, #fbcfe8, #bfdbfe)',
                      boxShadow: '0 4px 12px 0 rgba(244, 114, 182, 0.20)'
                    }}
                  >
                    Open ChatGPT
                  </button>
                </div>

                {/* Step 3: Tap it once on ChatGPT */}
                <div className="mb-4">
                  <p className="text-gray-700 font-medium mb-1.5">
                    Step 3: Tap it once on ChatGPT
                  </p>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    In the ChatGPT tab, make sure you're logged in, then click the "Onairos ChatGPT Link" bookmark once. 
                    We'll receive a secure token and begin extracting your chats, bringing your last <strong className="font-semibold">10 conversations</strong> into your Onairos account.
                  </p>
                </div>

                {/* Got it button */}
                <button
                  onClick={() => {
                    this.setConnected();
                  }}
                  className="w-full px-4 py-2 rounded-full font-medium text-white text-sm transition-transform hover:scale-[1.01]"
                  style={{
                    background: 'linear-gradient(to right, #fecaca, #bfdbfe)',
                    boxShadow: '0 4px 12px 0 rgba(248, 113, 113, 0.24)'
                  }}
                >
                  Got it, let's go
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
}

export default ChatGPTConnector;
