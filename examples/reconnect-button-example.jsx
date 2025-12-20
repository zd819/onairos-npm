/**
 * Example: Using OnairosReconnectButton to manage data sources
 * 
 * This example shows how to use the Reconnect Button alongside
 * the main Onairos authentication button.
 */

import React, { useState, useEffect } from 'react';
import { Onairos, OnairosReconnectButton } from 'onairos';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userData, setUserData] = useState(null);
  const [connectedAccounts, setConnectedAccounts] = useState([]);

  // Check if user is already signed in on component mount
  useEffect(() => {
    checkSignInStatus();
  }, []);

  const checkSignInStatus = () => {
    try {
      const savedUser = localStorage.getItem('onairosUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        setUserData(user);
        setIsSignedIn(true);
        setConnectedAccounts(user.connectedAccounts || []);
        console.log('User is signed in:', user.email);
      } else {
        setIsSignedIn(false);
      }
    } catch (error) {
      console.error('Error checking sign in status:', error);
      setIsSignedIn(false);
    }
  };

  const handleOnairosComplete = (result) => {
    console.log('Onairos authentication complete:', result);
    setIsSignedIn(true);
    setUserData(result.userData);
    setConnectedAccounts(result.userData?.connectedAccounts || []);
  };

  const handleReconnectComplete = (result) => {
    console.log('Reconnection complete:', result);
    console.log('Updated connected accounts:', result.connectedAccounts);
    
    // Update local state with new connections
    setConnectedAccounts(result.connectedAccounts);
    setUserData(result.userData);
    
    // You could also refresh data here if needed
    // refreshUserData();
  };

  const handleNoUserData = () => {
    console.log('No user data found - user needs to sign in');
    alert('Please sign in with Onairos first!');
    setIsSignedIn(false);
  };

  const handleLogout = () => {
    // Clear user data
    localStorage.removeItem('onairosUser');
    localStorage.removeItem('onairos_user_token');
    setIsSignedIn(false);
    setUserData(null);
    setConnectedAccounts([]);
    console.log('User logged out');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>My Application</h1>
      
      {!isSignedIn ? (
        // User is NOT signed in - show main Onairos button
        <div style={{ marginTop: '20px' }}>
          <h2>Welcome! Please sign in:</h2>
          <Onairos
            requestData={['personality', 'basic']}
            webpageName="My Application"
            appIcon="https://example.com/my-app-icon.png"
            onComplete={handleOnairosComplete}
            autoFetch={true}
            formatResponse={true}
          />
        </div>
      ) : (
        // User IS signed in - show dashboard with reconnect button
        <div style={{ marginTop: '20px' }}>
          <h2>Welcome back, {userData?.email || 'User'}!</h2>
          
          <div style={{ 
            backgroundColor: '#f5f5f5', 
            padding: '20px', 
            borderRadius: '8px',
            marginTop: '20px' 
          }}>
            <h3>Connected Data Sources</h3>
            {connectedAccounts.length > 0 ? (
              <ul>
                {connectedAccounts.map((account, index) => (
                  <li key={index} style={{ marginBottom: '8px' }}>
                    ✅ {account}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No accounts connected yet.</p>
            )}
            
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <OnairosReconnectButton 
                buttonText="Manage Data Sources"
                buttonStyle={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                appName="My Application"
                appIcon="https://example.com/my-app-icon.png"
                onComplete={handleReconnectComplete}
                onNoUserData={handleNoUserData}
              />
              
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  padding: '10px 20px',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Logout
              </button>
            </div>
          </div>
          
          <div style={{ 
            backgroundColor: '#e0f2fe', 
            padding: '20px', 
            borderRadius: '8px',
            marginTop: '20px' 
          }}>
            <h3>Your Data</h3>
            <p>Your personalized content will appear here...</p>
            {/* Display user's data, insights, etc. */}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

/**
 * ALTERNATIVE: Simple inline usage
 */

// Just add the reconnect button anywhere in your app:
export function SimpleExample() {
  return (
    <div>
      <h1>Settings</h1>
      <p>Manage your connected data sources:</p>
      
      <OnairosReconnectButton 
        buttonText="🔄 Reconnect Data Sources"
        appName="My App"
        onComplete={(result) => {
          console.log('Updated connections:', result.connectedAccounts);
          alert('Connections updated successfully!');
        }}
        onNoUserData={() => {
          alert('Please sign in first!');
        }}
      />
    </div>
  );
}

/**
 * ALTERNATIVE: With custom styling
 */

export function StyledExample() {
  return (
    <OnairosReconnectButton 
      buttonText="Manage Connections"
      buttonClass="custom-reconnect-button"
      buttonStyle={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '12px 24px',
        fontSize: '16px',
        fontWeight: '600',
        border: 'none',
        borderRadius: '12px',
        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}
      appName="My App"
      onComplete={(result) => {
        console.log('Success!', result);
      }}
    />
  );
}

/**
 * ALTERNATIVE: Settings page integration
 */

export function SettingsPage() {
  return (
    <div className="settings-page">
      <h1>Account Settings</h1>
      
      <section className="settings-section">
        <h2>Data Sources</h2>
        <p>Manage which platforms you've connected to Onairos.</p>
        
        <OnairosReconnectButton 
          buttonText="Manage Connected Accounts"
          appName="My App"
          onComplete={(result) => {
            console.log('Connections updated');
            // Refresh the page or update UI
            window.location.reload();
          }}
          onNoUserData={() => {
            window.location.href = '/signin';
          }}
        />
      </section>
      
      <section className="settings-section">
        <h2>Privacy Settings</h2>
        {/* Other settings... */}
      </section>
    </div>
  );
}

