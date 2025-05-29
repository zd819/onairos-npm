/**
 * API utility functions for the Onairos Data Request system
 */

/**
 * Get API access for data requests
 * @param {Object} options - The request options
 * @param {boolean} options.proofMode - Whether proof mode is enabled
 * @param {string} options.Web3Type - The web3 authentication type
 * @param {Array} options.Confirmations - Array of confirmations
 * @param {string} options.EncryptedUserPin - The encrypted user PIN
 * @param {string} options.Domain - The requesting domain
 * @param {string} options.UserSub - The user subject identifier
 */
export async function getAPIAccess({ proofMode, Web3Type, Confirmations, EncryptedUserPin, Domain, UserSub }) {
  try {
    const response = await fetch('https://api2.onairos.uk/getAPIAccess', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        proofMode,
        web3Type: Web3Type,
        confirmations: Confirmations,
        encryptedUserPin: EncryptedUserPin,
        domain: Domain,
        userSub: UserSub
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error getting API access:', error);
    throw error;
  }
}

/**
 * Reject a data request
 * This is a placeholder for the actual implementation
 */
export async function rejectDataRequest() {
  // Simulate network request
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ success: true });
    }, 500);
  });
}
