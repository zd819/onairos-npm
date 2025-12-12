import { useState } from 'react'

function App() {
  const [showOnairos, setShowOnairos] = useState(false)
  const [OnairosButton, setOnairosButton] = useState(null)

  // Lazy load OnairosButton to catch any import errors
  const loadOnairos = async () => {
    try {
      const module = await import('onairos')
      setOnairosButton(() => module.OnairosButton)
      setShowOnairos(true)
    } catch (error) {
      console.error('Failed to load Onairos:', error)
      alert('Error loading Onairos: ' + error.message)
    }
  }

  return (
    <div style={{ 
      width: '100%', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      backgroundColor: '#f0f0f0',
      padding: '20px'
    }}>
      <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '32px', color: '#000' }}>
        Onairos Mobile Preview
      </h1>
      
      <div style={{ 
        padding: '16px', 
        backgroundColor: 'white', 
        borderRadius: '12px', 
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)', 
        marginBottom: '32px',
        maxWidth: '400px',
        width: '100%'
      }}>
        {!showOnairos ? (
          <>
            <p style={{ marginBottom: '16px', color: '#666', textAlign: 'center' }}>
              App is working! Click below to load Onairos:
            </p>
            <button 
              onClick={loadOnairos}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              Load Onairos Button
            </button>
          </>
        ) : OnairosButton ? (
          <>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              Click the button below to start the flow:
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <OnairosButton 
                webpageName="Mobile Preview"
                appIcon="https://onairos.sirv.com/Images/OnairosBlack.png"
                testMode={true}
                autoFetch={true}
                visualType="full"
                buttonType="pill"
                textLayout="right"
                textColor="black"
              />
            </div>
          </>
        ) : (
          <p style={{ color: '#666', textAlign: 'center' }}>Loading...</p>
        )}
      </div>
      
      <p style={{ fontSize: '12px', color: '#999', textAlign: 'center' }}>
        Check Safari Web Inspector (Develop → Simulator) for console logs
      </p>
    </div>
  )
}

export default App


