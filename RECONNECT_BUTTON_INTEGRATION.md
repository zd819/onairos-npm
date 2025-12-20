# Reconnect Button Integration Guide

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Your Application                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐           ┌──────────────────┐       │
│  │   First Visit    │           │  Returning User  │       │
│  └────────┬─────────┘           └────────┬─────────┘       │
│           │                               │                 │
│           v                               v                 │
│  ┌──────────────────┐           ┌──────────────────┐       │
│  │  Onairos Button  │           │ Check localStorage│       │
│  │  (Main Sign-In)  │           │  'onairosUser'   │       │
│  └────────┬─────────┘           └────────┬─────────┘       │
│           │                               │                 │
│           │                               │                 │
│           v                               v                 │
│  ┌──────────────────────────────┐  ┌──────────────────┐   │
│  │   Email Auth + Onboarding    │  │  Show Dashboard  │   │
│  │   (Connect Initial Accounts) │  │   + User Data    │   │
│  └──────────────┬───────────────┘  └────────┬─────────┘   │
│                 │                            │             │
│                 v                            v             │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Save to localStorage                       │   │
│  │         { email, connectedAccounts, token }        │   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │        USER WANTS TO CHANGE CONNECTIONS            │   │
│  │                                                     │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │     OnairosReconnectButton Clicked          │ │   │
│  │  └─────────────────┬────────────────────────────┘ │   │
│  │                    │                              │   │
│  │                    v                              │   │
│  │  ┌──────────────────────────────────────────────┐ │   │
│  │  │  Check localStorage for 'onairosUser'        │ │   │
│  │  └─────────────────┬────────────────────────────┘ │   │
│  │                    │                              │   │
│  │         ┌──────────┴──────────┐                  │   │
│  │         │                     │                  │   │
│  │         v                     v                  │   │
│  │  ┌─────────────┐      ┌─────────────┐           │   │
│  │  │ User Found  │      │  No User    │           │   │
│  │  │   ✅        │      │   ❌        │           │   │
│  │  └──────┬──────┘      └──────┬──────┘           │   │
│  │         │                    │                  │   │
│  │         v                    v                  │   │
│  │  ┌─────────────┐      ┌─────────────┐           │   │
│  │  │   Open      │      │   Show      │           │   │
│  │  │ Onboarding  │      │   Error     │           │   │
│  │  │   Modal     │      │   Alert     │           │   │
│  │  └──────┬──────┘      └─────────────┘           │   │
│  │         │                                        │   │
│  │         v                                        │   │
│  │  ┌───────────────────────────────┐              │   │
│  │  │  UniversalOnboarding Modal   │              │   │
│  │  │                               │              │   │
│  │  │  - Show current connections   │              │   │
│  │  │  - Add new platforms          │              │   │
│  │  │  - Remove platforms           │              │   │
│  │  │  - Save changes               │              │   │
│  │  └──────────┬────────────────────┘              │   │
│  │             │                                   │   │
│  │             v                                   │   │
│  │  ┌──────────────────────────────────────┐      │   │
│  │  │  Update localStorage                 │      │   │
│  │  │  { connectedAccounts: [...new] }     │      │   │
│  │  └──────────┬───────────────────────────┘      │   │
│  │             │                                   │   │
│  │             v                                   │   │
│  │  ┌──────────────────────────────────────┐      │   │
│  │  │  Call onComplete Callback            │      │   │
│  │  │  - Updated connectedAccounts         │      │   │
│  │  │  - Updated userData                  │      │   │
│  │  │  - Timestamp                         │      │   │
│  │  └──────────┬───────────────────────────┘      │   │
│  │             │                                   │   │
│  │             v                                   │   │
│  │  ┌──────────────────────────────────────┐      │   │
│  │  │  Your App Updates UI                 │      │   │
│  │  │  - Refresh data                      │      │   │
│  │  │  - Show success message              │      │   │
│  │  │  - Re-render with new connections    │      │   │
│  │  └──────────────────────────────────────┘      │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
Your Application
│
├── User Not Signed In
│   └── <Onairos /> (Main Button)
│       ├── WelcomeScreen
│       ├── EmailAuth
│       ├── UniversalOnboarding
│       ├── PinSetup
│       └── DataRequest
│
└── User Signed In
    ├── Dashboard/Main UI
    └── <OnairosReconnectButton /> (New Component)
        └── UniversalOnboarding Modal
            ├── Current Connections List
            ├── Available Platforms
            ├── Add/Remove Actions
            └── Save Button
```

---

## Data Flow

### Initial Sign-In (Onairos Button)
```javascript
User clicks Onairos Button
  ↓
Complete auth flow
  ↓
Save to localStorage:
{
  email: "user@example.com",
  connectedAccounts: ["YouTube", "LinkedIn"],
  token: "jwt_token_here",
  onboardingComplete: true,
  pinCreated: true
}
```

### Reconnection (OnairosReconnectButton)
```javascript
User clicks Reconnect Button
  ↓
Read from localStorage('onairosUser')
  ↓
Open UniversalOnboarding modal with current connections
  ↓
User adds/removes platforms
  ↓
Update localStorage:
{
  ...existingData,
  connectedAccounts: ["YouTube", "LinkedIn", "Reddit"] // Updated
}
  ↓
Call onComplete({ connectedAccounts, userData, timestamp })
  ↓
Your app updates UI
```

---

## Code Integration Pattern

### Pattern 1: Settings Page

```jsx
// SettingsPage.jsx
import { OnairosReconnectButton } from 'onairos';

function SettingsPage() {
  const handleConnectionUpdate = (result) => {
    console.log('New connections:', result.connectedAccounts);
    // Refresh your app's data
    refreshUserData();
  };

  return (
    <div className="settings">
      <h2>Connected Data Sources</h2>
      <OnairosReconnectButton 
        buttonText="Manage Connections"
        appName="My App"
        onComplete={handleConnectionUpdate}
      />
    </div>
  );
}
```

### Pattern 2: Dashboard Widget

```jsx
// Dashboard.jsx
import { OnairosReconnectButton } from 'onairos';

function Dashboard() {
  const [connections, setConnections] = useState([]);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('onairosUser'));
    setConnections(userData?.connectedAccounts || []);
  }, []);

  return (
    <div className="dashboard">
      <div className="connections-widget">
        <h3>Your Connections</h3>
        <ul>
          {connections.map(conn => (
            <li key={conn}>{conn}</li>
          ))}
        </ul>
        <OnairosReconnectButton 
          buttonText="Edit"
          buttonClass="btn-sm"
          appName="My App"
          onComplete={(result) => {
            setConnections(result.connectedAccounts);
          }}
        />
      </div>
    </div>
  );
}
```

### Pattern 3: Conditional Rendering

```jsx
// App.jsx
import { Onairos, OnairosReconnectButton } from 'onairos';

function App() {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('onairosUser');
    setIsSignedIn(!!userData);
  }, []);

  return (
    <div>
      {!isSignedIn ? (
        // Show main Onairos button for first-time users
        <Onairos
          requestData={['personality', 'basic']}
          webpageName="My App"
          onComplete={() => setIsSignedIn(true)}
        />
      ) : (
        // Show reconnect button for existing users
        <div>
          <h1>Welcome back!</h1>
          <OnairosReconnectButton 
            buttonText="Manage Data Sources"
            appName="My App"
            onComplete={(result) => {
              console.log('Updated:', result.connectedAccounts);
            }}
          />
        </div>
      )}
    </div>
  );
}
```

---

## localStorage Structure

### What's Stored:
```javascript
localStorage.setItem('onairosUser', JSON.stringify({
  email: "user@example.com",
  username: "user123",
  verified: true,
  connectedAccounts: [
    "YouTube",
    "LinkedIn", 
    "Reddit",
    "Pinterest"
  ],
  onboardingComplete: true,
  pinCreated: true,
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  lastSessionTime: "2025-12-20T10:30:00.000Z",
  provider: "google"
}));
```

### How to Read:
```javascript
const userData = JSON.parse(localStorage.getItem('onairosUser'));
console.log('Connected:', userData.connectedAccounts);
```

### How to Check if User is Signed In:
```javascript
const isSignedIn = !!localStorage.getItem('onairosUser');
```

---

## Event Flow Timeline

```
User Action: Click OnairosReconnectButton
  ↓ 0ms
Check: localStorage.getItem('onairosUser')
  ↓ 1ms
  ├─ Found ✅
  │   ↓
  │ Set: showOverlay = true
  │   ↓
  │ Render: ModalPageLayout + UniversalOnboarding
  │   ↓
  │ User: Views current connections
  │   ↓
  │ User: Adds/removes platforms (OAuth flows)
  │   ↓ ~5-30s (depending on user actions)
  │ User: Clicks "Continue" or "Save"
  │   ↓
  │ Update: localStorage with new connectedAccounts
  │   ↓
  │ Call: onComplete({ connectedAccounts, userData, timestamp })
  │   ↓
  │ Set: showOverlay = false
  │   ↓
  │ Your App: Update UI with new connections
  │
  └─ Not Found ❌
      ↓
    Call: onNoUserData()
      ↓
    Show: Alert or redirect to sign in
```

---

## Error Handling Flow

```
OnairosReconnectButton Click
  ↓
Try: Read localStorage
  │
  ├─ Success: User data exists
  │   ↓
  │ Validate: email/username exists
  │   │
  │   ├─ Valid ✅
  │   │   ↓
  │   │ Open Modal
  │   │
  │   └─ Invalid ❌
  │       ↓
  │     Call: onNoUserData() or show alert
  │
  └─ Error: No user data
      ↓
    Call: onNoUserData() or show alert
```

---

## Security Considerations

1. **Token Storage**: JWT tokens stored in localStorage
   - Use HTTPS in production
   - Tokens have expiration
   - Clear on logout

2. **User Validation**: Component validates user data before showing modal
   - Checks for email/username
   - Validates data structure
   - Graceful fallbacks

3. **OAuth Flows**: Platform connections use secure OAuth 2.0
   - PKCE flow for enhanced security
   - State parameter validation
   - Redirect URI whitelisting

---

## Performance Notes

- **Lazy Loading**: Modal only rendered when `showOverlay = true`
- **State Management**: Minimal re-renders using React hooks
- **localStorage**: Synchronous but fast (typically <1ms)
- **Modal Animation**: CSS transitions for smooth UX
- **Mobile Optimization**: Separate mobile/desktop layouts

---

## Common Integration Scenarios

### Scenario 1: User Profile Page
```jsx
<div className="profile">
  <h2>Account Settings</h2>
  <OnairosReconnectButton buttonText="Manage Data" />
</div>
```

### Scenario 2: Data Dashboard
```jsx
<div className="dashboard">
  <h2>Your Connected Apps</h2>
  <ConnectionsList />
  <OnairosReconnectButton buttonText="Edit Connections" />
</div>
```

### Scenario 3: First-Time Setup Prompt
```jsx
{connectedAccounts.length === 0 && (
  <div className="prompt">
    <p>Connect more apps for better insights!</p>
    <OnairosReconnectButton buttonText="Connect Apps" />
  </div>
)}
```

---

## Next Steps

1. ✅ Install/update to onairos v4.3.2+
2. ✅ Import the component: `import { OnairosReconnectButton } from 'onairos'`
3. ✅ Add to your UI (settings/dashboard/profile page)
4. ✅ Test the flow with a signed-in user
5. ✅ Handle callbacks (`onComplete`, `onNoUserData`)
6. ✅ Style to match your app's design

---

For more details, see:
- **Full Documentation**: `RECONNECT_BUTTON_USAGE.md`
- **Examples**: `examples/reconnect-button-example.jsx`
- **Changelog**: `CHANGELOG_RECONNECT_BUTTON.md`

