export const launchOnairosApp = async () => {
  const nonce = Date.now();
  const returnLink = encodeURIComponent(window.location.origin + '/auth/callback');
  
  const onairosUrl = `onairos://authenticate?nonce=${nonce}&callback=${returnLink}&appName=google`;
  
  // Try to open Onairos app
  window.location.href = onairosUrl;
  
  // Fallback to app store after timeout
  setTimeout(() => {
    window.location.href = 'https://apps.apple.com/app/onairos/id123456789';
  }, 2500);
};

export const handleDeepLink = () => {
  // Listen for return from Onairos app
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'ONAIROS_AUTH') {
      const { token, credentials } = event.data;
      if (token) {
        localStorage.setItem('onairosToken', token);
        localStorage.setItem('onairosCredentials', JSON.stringify(credentials));
      }
    }
  });
}; 