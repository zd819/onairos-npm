import React from 'react';
import ReactDOM from 'react-dom/client';
import DataRequestPage from './DataRequestPage.jsx';

// Global variables to store data from parent window
let proofMode = false;
let domain = '';
let userSub = null;
let encryptedUserPin = null;

// Handle messages from the parent window
window.addEventListener('message', (event) => {
  // Verify the sender origin if needed
  // if (event.origin !== 'expected-origin') return;
  
  if (event.data && event.data.source === 'onairosButton') {
    proofMode = event.data.proofMode || false;
    domain = event.data.domain || '';
    userSub = event.data.userSub || null;
    encryptedUserPin = event.data.encryptedUserPin || null;
    
    // Re-render with the new data
    renderApp();
  }
});

// Notify the parent window that the iframe is ready
window.parent.postMessage({
  source: 'onairosIframe',
  action: 'iframeReady'
}, '*');

// Function to render the React app
function renderApp() {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(
    <DataRequestPage 
      proofMode={proofMode}
      domain={domain}
      userSub={userSub}
      encryptedUserPin={encryptedUserPin}
    />
  );
}

// Initial render
renderApp();
