# Onairos Reconnect Button

The `OnairosReconnectButton` component allows users to manage and change their connected data sources after they have already signed in with Onairos.

## Features

- ✅ Checks if user Onairos data is stored
- ✅ Opens data connection page when clicked
- ✅ Allows users to add or remove connected accounts
- ✅ Responsive (mobile and desktop)
- ✅ Customizable styling and callbacks

## Installation

The Reconnect Button is included in the main Onairos package:

```bash
npm install onairos
```

## Basic Usage

### React

```jsx
import React from 'react';
import { OnairosReconnectButton } from 'onairos';

function App() {
  return (
    <div>
      <h1>My App</h1>
      <OnairosReconnectButton 
        buttonText="Manage Data Sources"
        appName="My App"
        onComplete={(result) => {
          console.log('Updated connections:', result.connectedAccounts);
        }}
      />
    </div>
  );
}

export default App;
```

### HTML + Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App with Onairos</title>
</head>
<body>
  <div id="reconnect-container"></div>
  
  <script type="module">
    import { OnairosReconnectButton } from 'onairos';
    import React from 'react';
    import ReactDOM from 'react-dom';
    
    ReactDOM.render(
      React.createElement(OnairosReconnectButton, {
        buttonText: "Change Data Sources",
        appName: "My App",
        onComplete: (result) => {
          console.log('Updated!', result);
        }
      }),
      document.getElementById('reconnect-container')
    );
  </script>
</body>
</html>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `buttonText` | string | "Reconnect Data Sources" | Text displayed on the button |
| `buttonClass` | string | "" | Custom CSS classes for the button |
| `buttonStyle` | object | {} | Custom inline styles for the button |
| `appIcon` | string | null | URL for your app's icon |
| `appName` | string | "Your App" | Name of your application |
| `onComplete` | function | null | Callback when connection changes are saved |
| `onNoUserData` | function | null | Callback when no user data is found |
| `priorityPlatform` | string | null | Platform to prioritize ('gmail', 'pinterest', etc.) |
| `rawMemoriesOnly` | boolean | false | Show only LLM connections |
| `rawMemoriesConfig` | object | null | Configuration for RAW memories collection |

## Advanced Examples

### Custom Styling

```jsx
<OnairosReconnectButton 
  buttonText="⚙️ Manage Connections"
  buttonClass="custom-button-class"
  buttonStyle={{
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '12px 24px',
    fontSize: '16px',
    borderRadius: '8px'
  }}
  appName="My App"
/>
```

### With Callbacks

```jsx
<OnairosReconnectButton 
  buttonText="Update Data Sources"
  appName="My App"
  onComplete={(result) => {
    console.log('Connection update complete!');
    console.log('Connected accounts:', result.connectedAccounts);
    console.log('User data:', result.userData);
    
    // Update your app's state
    setUserConnections(result.connectedAccounts);
  }}
  onNoUserData={() => {
    console.log('No user found - redirecting to sign in');
    // Redirect user to sign in page
    navigate('/signin');
  }}
/>
```

### Priority Platform

If you want to highlight a specific platform:

```jsx
<OnairosReconnectButton 
  buttonText="Connect LinkedIn"
  appName="Job Matching App"
  priorityPlatform="linkedin"
  onComplete={(result) => {
    console.log('LinkedIn connection updated');
  }}
/>
```

### LLM Data Only

For apps that only need LLM conversation data:

```jsx
<OnairosReconnectButton 
  buttonText="Manage AI Conversations"
  appName="AI Assistant"
  rawMemoriesOnly={true}
  rawMemoriesConfig={{
    providers: ['chatgpt', 'claude', 'gemini']
  }}
  onComplete={(result) => {
    console.log('LLM connections updated');
  }}
/>
```

## User Flow

1. **User clicks button** → Component checks localStorage for `onairosUser`
2. **If user data exists** → Opens UniversalOnboarding modal
3. **User manages connections** → Can add/remove connected accounts
4. **User saves changes** → Updates localStorage and calls `onComplete`
5. **Modal closes** → User returns to your app with updated connections

## Error Handling

### No User Data Found

If no Onairos user data is found, the button will:
- Log a warning to console
- Call `onNoUserData` callback (if provided)
- Show an alert (if no callback provided)

```jsx
<OnairosReconnectButton 
  onNoUserData={() => {
    alert('Please sign in with Onairos first!');
    // Or redirect to your sign-in page
  }}
/>
```

### Invalid User Data

If user data is corrupted or missing essential fields:
- The component validates email/username presence
- Shows appropriate error message
- Prompts user to sign in again

## Integration with Main Onairos Button

Typically, you'll use both components together:

```jsx
import { Onairos, OnairosReconnectButton } from 'onairos';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is signed in
    const userData = localStorage.getItem('onairosUser');
    setIsSignedIn(!!userData);
  }, []);
  
  return (
    <div>
      {!isSignedIn ? (
        <Onairos
          requestData={['personality', 'basic']}
          webpageName="My App"
          onComplete={(result) => {
            setIsSignedIn(true);
            console.log('User signed in!');
          }}
        />
      ) : (
        <div>
          <h2>Welcome back!</h2>
          <OnairosReconnectButton 
            buttonText="Manage Data Sources"
            appName="My App"
            onComplete={(result) => {
              console.log('Connections updated:', result.connectedAccounts);
            }}
          />
        </div>
      )}
    </div>
  );
}
```

## Checking Connection Status

You can check which accounts are connected:

```javascript
// Get user data from localStorage
const userData = JSON.parse(localStorage.getItem('onairosUser'));

if (userData && userData.connectedAccounts) {
  console.log('Connected accounts:', userData.connectedAccounts);
  // Example: ['YouTube', 'LinkedIn', 'Gmail']
  
  // Check specific platform
  const hasYouTube = userData.connectedAccounts.includes('YouTube');
  console.log('Has YouTube connected:', hasYouTube);
}
```

## Mobile Support

The Reconnect Button automatically detects mobile devices and adjusts the UI accordingly:
- **Desktop**: Shows as modal overlay (max-width: 90vw)
- **Mobile**: Shows as full-screen modal
- **Native Apps** (Capacitor/React Native): Optimized for native experience

## Styling Customization

### Using Tailwind Classes

```jsx
<OnairosReconnectButton 
  buttonClass="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-all"
  buttonText="🔄 Reconnect"
/>
```

### Using CSS Modules

```jsx
import styles from './MyStyles.module.css';

<OnairosReconnectButton 
  buttonClass={styles.reconnectButton}
  buttonText="Manage Connections"
/>
```

## Best Practices

1. **Place strategically**: Put the reconnect button in settings or profile pages
2. **Clear labeling**: Use descriptive button text like "Manage Data Sources" or "Update Connections"
3. **Handle errors**: Always provide `onNoUserData` callback for better UX
4. **Update state**: Use `onComplete` to update your app's state when connections change
5. **Check before showing**: Only show the button when user is signed in

## Troubleshooting

### Button doesn't open modal

- Check browser console for errors
- Verify user data exists in localStorage: `localStorage.getItem('onairosUser')`
- Ensure user has completed initial sign-in with main Onairos button

### Changes not persisting

- Check that `onComplete` callback is receiving the updated data
- Verify localStorage is accessible (not blocked by browser settings)
- Ensure your app refreshes state after connection changes

### Modal styling issues

- Check that Tailwind CSS is properly loaded
- Verify no CSS conflicts with your app's styles
- Try providing custom `buttonClass` or `buttonStyle`

## Support

For issues or questions:
- GitHub: https://github.com/zd819/onairos-npm
- Website: https://onairos.uk
- Email: support@onairos.uk

## License

Apache-2.0

