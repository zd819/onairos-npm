import React from 'react';
import { openExtensionInstallPage, LLM_URLS } from '../utils/extensionDetection';

/**
 * Extension Installation Prompt Component
 * 
 * Displays when a user tries to connect to an LLM but doesn't have 
 * the Onairos browser extension installed.
 */
const ExtensionInstallPrompt = ({ 
  open = false, 
  onClose, 
  platform = 'chatgpt',
  onInstallClick = null 
}) => {
  if (!open) return null;

  const platformNames = {
    chatgpt: 'ChatGPT',
    claude: 'Claude',
    gemini: 'Gemini',
    grok: 'Grok'
  };

  const platformName = platformNames[platform] || 'LLM';
  const platformUrl = LLM_URLS[platform] || '#';

  const handleInstallClick = () => {
    if (onInstallClick) {
      onInstallClick(platform);
    } else {
      openExtensionInstallPage(platform);
    }
  };

  const handleDirectVisit = () => {
    window.open(platformUrl, '_blank');
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-full md:max-h-[90vh] overflow-hidden">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Install Onairos Extension
            </h2>
          </div>
          
          {/* Content */}
          <div className="space-y-4 text-gray-700">
            <p>
              To connect with <strong>{platformName}</strong> and enable personalized AI interactions, 
              you need the Onairos browser extension installed.
            </p>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🚀 What the extension does:</h3>
              <ul className="list-disc ml-4 space-y-1 text-blue-800 text-sm">
                <li>Detects when you're on {platformName} and other LLM sites</li>
                <li>Enables secure data sharing with your consent</li>
                <li>Personalizes AI responses based on your preferences</li>
                <li>Works seamlessly in the background</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">⚡ Quick Setup:</h3>
              <ol className="list-decimal ml-4 space-y-1 text-amber-800 text-sm">
                <li>Click "Install Extension" below</li>
                <li>Add the extension from Chrome Web Store</li>
                <li>Return here and try connecting again</li>
              </ol>
            </div>
            
            <p className="text-sm text-gray-600">
              Don't want to install the extension? You can still visit{' '}
              <a 
                href={platformUrl} 
                className="text-blue-600 hover:underline" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                {platformUrl}
              </a>
              {' '}directly, but you won't get personalized AI features.
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex flex-col space-y-3 mt-6">
            <button
              onClick={handleInstallClick}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Install Onairos Extension
            </button>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDirectVisit}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                Visit {platformName} Anyway
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              The Onairos extension is free, secure, and respects your privacy. 
              <br />
              <a href="https://onairos.uk/privacy" className="text-blue-600 hover:underline">
                Learn more about our privacy policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExtensionInstallPrompt;
