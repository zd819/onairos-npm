import React, { Component } from 'react';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

class YoutubeConnector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      open: false,
      isConnecting: false,
    };
    this.handleClose = this.handleClose.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.youtubeConnect = this.youtubeConnect.bind(this);
    this.setConnected = this.setConnected.bind(this);
    this.setDisconnected = this.setDisconnected.bind(this);
  }
// ... (rest of the file until youtubeConnect)
  async youtubeConnect() {
    this.setState({ isConnecting: true });
    
    const jsonData = {
      session: {
        username: localStorage.getItem("username") || this.props.username
      },
    };

    try {
      const response = await fetch('https://api2.onairos.uk/youtube/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      const result = await response.json();
      
      if (result.youtubeURL) {
        if (Capacitor.isNativePlatform()) {
             console.log('Detected Native Platform, using Capacitor Browser for YouTube');
            await Browser.open({ 
                url: result.youtubeURL,
                windowName: '_blank',
                presentationStyle: 'fullscreen'
            });
        } else {
            window.location.href = result.youtubeURL;
        }
      } else {
        console.error('No YouTube URL received');
        this.setState({ isConnecting: false });
      }
    } catch (error) {
      console.error('YouTube connection error:', error);
      this.setState({ isConnecting: false });
    }
  }

  render() {
// ... (rest of the file)
    const { open = this.props.open || this.state.open } = this.props;
    
    if (!open) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-full md:max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Grant Onairos Access to your YouTube Account?
            </h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                Grant Permission to your YouTube Account, so we can build your Data Models.
              </p>
              
              <div>
                <p className="font-medium mb-2">We will access your YouTube:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Basic Account Info</li>
                  <li>Liked and Watched Videos</li>
                  <li>Subscribed Channels and Playlist Videos</li>
                </ul>
              </div>
              
              <p>
                We will delete all the data used once your Model is Created
              </p>
              
              <p className="text-sm">
                <a href="https://onairos.uk/compliance-google-policy" className="text-blue-600 hover:underline">
                  Onairos
                </a>{' '}
                complies with{' '}
                <a href="https://policies.google.com/privacy" className="text-blue-600 hover:underline">
                  Google API Services User Data Policy
                </a>
              </p>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button
                onClick={this.handleClose}
                disabled={this.state.isConnecting}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Disagree
              </button>
              <button
                onClick={this.youtubeConnect}
                disabled={this.state.isConnecting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {this.state.isConnecting ? 'Connecting...' : 'Agree'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default YoutubeConnector; 