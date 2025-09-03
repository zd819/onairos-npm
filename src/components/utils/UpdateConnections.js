/**
 * UpdateConnections Utility
 * Handles adding and removing user connections to/from the Onairos server
 */

/**
 * Update user connections on the Onairos server
 * @param {Object} options - Update options
 * @param {string} options.updateType - 'Add' or 'Remove'
 * @param {string} options.newConnection - The connection name to add/remove
 * @param {string} options.username - Username (optional, will use localStorage if not provided)
 * @returns {Promise} - Promise resolving with the server response
 */
export default async function UpdateConnections({ updateType, newConnection, username = null }) {
  const jsonData = {
    session: {
      username: username || localStorage.getItem("username")
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log(`UpdateConnections: ${updateType} ${newConnection}`, result);
    return result;
  } catch (error) {
    console.error('UpdateConnections error:', error);
    throw error;
  }
} 