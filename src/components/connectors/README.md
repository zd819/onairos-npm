# OAuth Connectors

This directory contains OAuth connector components that handle authentication flows for various social media and service platforms. Each connector follows the same pattern established in the original YoutubeInfo schema.

## Available Connectors

- **YoutubeConnector** - YouTube OAuth integration
- **LinkedInConnector** - LinkedIn OAuth integration  
- **InstagramConnector** - Instagram OAuth integration
- **PinterestConnector** - Pinterest OAuth integration
- **RedditConnector** - Reddit OAuth integration
- **GmailConnector** - Gmail OAuth integration

## Architecture

### Component Structure

Each connector follows this consistent pattern:

```javascript
class PlatformConnector extends Component {
  constructor(props) {
    super(props);
    this.state = {
      connected: false,
      open: false,
      isConnecting: false,
    };
  }

  // Connection management methods
  setConnected() { /* Handle successful connection */ }
  setDisconnected() { /* Handle disconnection */ }
  
  // API integration
  async updateConnections(updateType, newConnection) { /* Update server */ }
  async platformConnect() { /* Initiate OAuth flow */ }
  
  // UI handlers
  handleOpen() { /* Open dialog */ }
  handleClose() { /* Close dialog */ }
  
  render() { /* Render OAuth consent dialog */ }
}
```

### Props Interface

All connectors accept these props:

- `open` (boolean) - Controls dialog visibility
- `onClose` (function) - Called when dialog is closed
- `onConnectionChange` (function) - Called when connection status changes
- `username` (string) - User identifier for API calls

### API Integration

Each connector integrates with the Onairos API:

- **Authorization Endpoint**: `https://api2.onairos.uk/{platform}/authorize`
- **Connection Management**: `https://api2.onairos.uk/connections/update`

## Usage

### Basic Implementation

```javascript
import { YoutubeConnector } from './components/connectors';

function MyComponent() {
  const [showYouTube, setShowYouTube] = useState(false);
  
  const handleConnectionChange = (platform, isConnected) => {
    console.log(`${platform} connection status:`, isConnected);
  };

  return (
    <>
      <button onClick={() => setShowYouTube(true)}>
        Connect YouTube
      </button>
      
      <YoutubeConnector
        open={showYouTube}
        onClose={() => setShowYouTube(false)}
        onConnectionChange={handleConnectionChange}
        username="user@example.com"
      />
    </>
  );
}
```

### Integration with UniversalOnboarding

The connectors are integrated into the `UniversalOnboarding` component:

```javascript
// Platform configuration
const platforms = [
  { name: 'YouTube', icon: '📺', color: 'bg-red-500', connector: 'youtube' },
  { name: 'LinkedIn', icon: '💼', color: 'bg-blue-700', connector: 'linkedin' },
  // ... other platforms
];

// Toggle handler
const handleToggle = (platformName, connectorType) => {
  if (isCurrentlyConnected) {
    // Disconnect logic
  } else {
    // Open OAuth dialog
    setActiveConnector(connectorType);
  }
};

// Render connectors
<YoutubeConnector 
  open={activeConnector === 'youtube'}
  onClose={() => setActiveConnector(null)}
  onConnectionChange={handleConnectionChange}
  username={username}
/>
```

## OAuth Flow

### 1. User Interaction
- User clicks platform toggle in UniversalOnboarding
- Connector dialog opens with consent information

### 2. Authorization Request
```javascript
const jsonData = {
  session: {
    username: localStorage.getItem("username") || this.props.username
  },
};

const response = await fetch('https://api2.onairos.uk/youtube/authorize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(jsonData),
});

const result = await response.json();
window.location.href = result.youtubeURL; // Redirect to OAuth
```

### 3. Connection Management
```javascript
const updateConnections = async (updateType, newConnection) => {
  const jsonData = {
    session: { username: this.props.username },
    updateType, // 'Add' or 'Remove'
    newConnection // Platform name
  };
  
  await fetch('https://api2.onairos.uk/connections/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jsonData),
  });
};
```

## Data Access Permissions

### YouTube
- Basic Account Info
- Liked and Watched Videos  
- Subscribed Channels and Playlist Videos

### LinkedIn
- Basic Profile Information
- Professional Experience
- Network Connections
- Posts and Activity

### Instagram
- Basic Profile Information
- Posts and Stories
- Liked Content
- Following and Followers

### Pinterest
- Basic Profile Information
- Boards and Pins
- Saved and Liked Pins
- Following and Followers

### Reddit
- Basic Profile Information
- Posts and Comments
- Upvoted and Saved Content
- Subscribed Subreddits

### Gmail
- Basic Account Information
- Email Metadata (subjects, dates, senders)
- Email Categories and Labels
- Communication Patterns
- **Note**: Email content is NOT accessed

## Security & Privacy

### Data Handling
- All data is processed securely according to platform policies
- Data is deleted after model creation
- Only metadata is accessed for email services

### Compliance
- **Google Services**: Complies with [Google API Services User Data Policy](https://policies.google.com/privacy)
- **Meta Platforms**: Complies with [Meta Platform Policy](https://developers.facebook.com/policy)
- **General**: Follows [Onairos Privacy Policy](https://onairos.uk/privacy-policy)

### API Security
- All requests use HTTPS
- User authentication via session tokens
- Server-side OAuth token management

## Error Handling

### Connection Errors
```javascript
try {
  const response = await fetch(endpoint, options);
  const result = await response.json();
  
  if (result.platformURL) {
    window.location.href = result.platformURL;
  } else {
    console.error('No OAuth URL received');
    this.setState({ isConnecting: false });
  }
} catch (error) {
  console.error('Connection error:', error);
  this.setState({ isConnecting: false });
}
```

### State Management
- Loading states prevent multiple simultaneous requests
- Error states provide user feedback
- Connection states persist across sessions

## Styling

### Design System
- Uses Tailwind CSS for consistent styling
- Modal overlays with backdrop blur
- Responsive design for mobile/desktop
- Accessible color contrast and focus states

### UI Components
- Fixed overlay with centered modal
- Clear consent information with bullet points
- Prominent action buttons (Agree/Disagree)
- Loading states with disabled buttons

## Testing

### Manual Testing
1. Click platform toggle in UniversalOnboarding
2. Verify consent dialog opens with correct information
3. Test "Disagree" button closes dialog
4. Test "Agree" button initiates OAuth flow
5. Verify connection state updates correctly

### Integration Testing
- Test with different username formats
- Verify API error handling
- Test connection/disconnection flows
- Validate state persistence

## Future Enhancements

### Additional Platforms
- Twitter/X integration
- TikTok integration  
- Facebook integration
- Discord integration

### Enhanced Features
- Connection status indicators
- Data usage analytics
- Granular permission controls
- Batch connection management

### Performance
- Lazy loading of connector components
- Connection state caching
- Optimized API calls 