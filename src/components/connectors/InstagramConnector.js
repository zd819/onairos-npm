import React, { Component } from 'react';

class InstagramConnector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      open: false,
      isConnecting: false,
    };
    this.handleClose = this.handleClose.bind(this);
    this.handleOpen = this.handleOpen.bind(this);
    this.instagramConnect = this.instagramConnect.bind(this);
    this.setConnected = this.setConnected.bind(this);
    this.setDisconnected = this.setDisconnected.bind(this);
  }

  setConnected() {
    this.setState({ connected: true });
    if (this.props.onConnectionChange) {
      this.props.onConnectionChange('Instagram', true);
    }
    this.handleClose();
  }

  setDisconnected() {
    this.updateConnections('Remove', 'Instagram').then(() => {
      this.setState({ connected: false });
      if (this.props.onConnectionChange) {
        this.props.onConnectionChange('Instagram', false);
      }
      this.handleClose();
    }).catch((error) => {
      console.error('Error removing Instagram connection:', error);
    });
  }

  async updateConnections(updateType, newConnection) {
    const jsonData = {
      session: {
        username: localStorage.getItem("username") || this.props.username
      },
      updateType,
      newConnection
    };

    try {
      const response = await fetch('https://api2.onairos.uk/connections/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });
      return await response.json();
    } catch (error) {
      console.error('UpdateConnections error:', error);
      throw error;
    }
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

  async instagramConnect() {
    this.setState({ isConnecting: true });
    
    const jsonData = {
      session: {
        username: localStorage.getItem("username") || this.props.username
      },
    };

    try {
      const response = await fetch('https://api2.onairos.uk/instagram/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
      });

      const result = await response.json();
      
      if (result.instagramURL) {
        window.location.href = result.instagramURL;
      } else {
        console.error('No Instagram URL received');
        this.setState({ isConnecting: false });
      }
    } catch (error) {
      console.error('Instagram connection error:', error);
      this.setState({ isConnecting: false });
    }
  }

  render() {
    const { open = this.props.open || this.state.open } = this.props;
    
    if (!open) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-full md:max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Grant Onairos Access to your Instagram Account?
            </h2>
            
            <div className="space-y-4 text-gray-700">
              <p>
                Grant Permission to your Instagram Account, so we can build your Data Models.
              </p>
              
              <div>
                <p className="font-medium mb-2">We will access your Instagram:</p>
                <ul className="list-disc ml-6 space-y-1">
                  <li>Basic Profile Information</li>
                  <li>Posts and Stories</li>
                  <li>Liked Content</li>
                  <li>Following and Followers</li>
                </ul>
              </div>
              
              <p>
                We will delete all the data used once your Model is Created
              </p>
              
              <p className="text-sm">
                <a href="https://onairos.uk/compliance-meta-policy" className="text-blue-600 hover:underline">
                  Onairos
                </a>{' '}
                complies with{' '}
                <a href="https://developers.facebook.com/policy" className="text-blue-600 hover:underline">
                  Meta Platform Policy
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
                onClick={this.instagramConnect}
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

export default InstagramConnector; 