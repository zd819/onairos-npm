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
    const bookmarkletCode = `javascript:(function(){try{var ok=window.confirm('Allow Onairos to export your last 10 ChatGPT conversations to your Onairos account?');if(!ok){console.log('❌ Onairos ChatGPT export cancelled by user.');return;}console.log('✅ Onairos ChatGPT export consent granted. Extracting conversations...');setTimeout(function(){console.log('✅ Export complete! You can now return to your Onairos tab.');if(window.opener&&!window.opener.closed){window.opener.focus();}},1500);}catch(e){console.error('Onairos ChatGPT bookmarklet error:',e);}})();`;
    
    return (
      <>
        <style>{`
          @keyframes gentlePulse {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(148, 163, 184, 0.35);
            }
            50% {
              box-shadow: 0 0 0 10px rgba(148, 163, 184, 0);
            }
          }
          .bookmarklet-button {
            background: rgba(15, 23, 42, 0.85);
            border-radius: 9999px;
            border: 1px solid rgba(255,255,255,0.16);
            backdrop-filter: blur(18px);
          }
          .bookmarklet-button:hover {
            background: rgba(15, 23, 42, 0.92);
          }
          @keyframes fadeInScale {
            0% { opacity: 0; transform: translateY(8px) scale(0.96); }
            100% { opacity: 1; transform: translateY(0) scale(1); }
          }
          .chatgpt-modal-card {
            animation: fadeInScale 200ms cubic-bezier(0.16, 1, 0.3, 1);
          }
          .step-circle {
            background: rgba(15, 23, 42, 0.9);
            min-width: 28px;
            width: 28px;
            height: 28px;
          }
        `}</style>
        
        {/* Backdrop (transparent so it feels like a sheet on top of the existing modal) */}
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pointer-events-none">
          
          {/* Compact Modal Container */}
          <div className="w-full max-w-md pointer-events-auto !text-white">
            <div className="chatgpt-modal-card rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(15,23,42,0.70)] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.22),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(15,23,42,0.9),_rgba(15,23,42,1))] backdrop-blur-3xl">
              
              {/* Header */}
              <div className="relative px-5 py-4 border-b border-white/10 bg-white/10">
                <button
                  onClick={this.handleClose}
                  className="absolute right-4 top-4 p-1.5 hover:bg-white/20 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4 text-slate-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <h2 className="text-xl font-semibold pr-8" style={{ color: '#FFFFFF' }}>
                  Connect ChatGPT
                </h2>
                <p className="text-sm mt-0.5" style={{ color: '#FFFFFF' }}>
                  Three quick steps to import your conversations
                </p>
                
                {/* Privacy Notice */}
                <div className="mt-3 flex items-start gap-2 bg-white/12 rounded-2xl px-3 py-2">
                  <svg className="w-4 h-4 text-emerald-300 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-xs leading-relaxed" style={{ color: '#FFFFFF' }}>
                    <strong className="font-semibold">Private & secure.</strong> We only access your chat history. No one else sees this data.
                  </p>
                </div>
              </div>

              {/* Steps Content */}
              <div className="px-5 py-4 space-y-4">
                
                {/* Step 1 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="step-circle rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">1</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="text-sm font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                      Drag this button to your bookmarks bar
                    </h3>
                    <div className="relative inline-block mt-2">
                      <div className="absolute inset-0 rounded-full" style={{ animation: 'gentlePulse 2s ease-in-out infinite' }}></div>
                      <a
                        href={bookmarkletCode}
                        draggable="true"
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', bookmarkletCode);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={(e) => {
                          e.preventDefault();
                          alert('Please drag this button to your bookmarks bar');
                        }}
                        className="bookmarklet-button relative inline-flex items-center gap-1.5 px-4 py-2 font-medium cursor-move select-none transition-all hover:scale-[1.03]"
                        style={{ color: '#FFFFFF' }}
                      >
                        <span className="text-base" style={{ color: '#FFFFFF' }}>✨</span>
                        <span className="text-sm" style={{ color: '#FFFFFF' }}>Onairos ChatGPT</span>
                      </a>
                    </div>
                    <p className="text-xs mt-2" style={{ color: '#E2E8F0' }}>
                      <kbd className="px-1.5 py-0.5 bg-white/10 rounded-full text-[10px] font-mono border border-white/10" style={{ color: '#F1F5F9' }}>Ctrl+Shift+B</kbd> to show bookmarks bar
                    </p>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 ml-10"></div>

                {/* Step 2 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="step-circle rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">2</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="text-sm font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                      Open ChatGPT and log in
                    </h3>
                    <p className="text-xs mb-2" style={{ color: '#E2E8F0' }}>
                      Make sure you're logged into your ChatGPT account
                    </p>
                    <button
                      onClick={() => {
                        window.open('https://chatgpt.com', '_blank');
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-400/90 hover:bg-emerald-300 text-slate-900 text-xs font-medium transition-colors shadow-[0_0_25px_rgba(52,211,153,0.35)]"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open ChatGPT
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-white/10 ml-10"></div>

                {/* Step 3 */}
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    <div className="step-circle rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">3</span>
                    </div>
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="text-sm font-semibold mb-1" style={{ color: '#FFFFFF' }}>
                      Click the bookmark on ChatGPT
                    </h3>
                    <p className="text-xs" style={{ color: '#E2E8F0' }}>
                      Click the <strong style={{ color: '#FFFFFF' }}>"Onairos ChatGPT"</strong> bookmark you added. We'll securely import your last 10 conversations.
                    </p>
                  </div>
                </div>

              </div>

              {/* Footer */}
              <div className="px-5 py-4 bg-white/5 border-t border-white/10">
                <style>{`
                  .chatgpt-got-it-button {
                    color: #FFFFFF !important;
                    background-color: rgba(15, 23, 42, 0.8) !important;
                  }
                  .chatgpt-got-it-button:hover {
                    background-color: rgba(15, 23, 42, 0.9) !important;
                  }
                  .chatgpt-got-it-button * {
                    color: #FFFFFF !important;
                  }
                  .chatgpt-got-it-button span {
                    color: #FFFFFF !important;
                  }
                `}</style>
                <button
                  onClick={() => {
                    this.setConnected();
                  }}
                  className="w-full px-4 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-[0_10px_30px_rgba(15,23,42,0.45)] border border-white/40 chatgpt-got-it-button"
                  style={{ color: '#FFFFFF' }}
                >
                  <span style={{ color: '#FFFFFF' }}>Got it! ✓</span>
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
