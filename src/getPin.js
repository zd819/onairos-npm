export default async function getPin(userSub){
  try {
    const response = await fetch('https://api2.onairos.uk/getAccountInfoFromUserSub', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        'userSub': userSub
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting PIN:', error);
    throw error;
  }
}


