export default async function getPin(hashedOthentSub){
    const jsonData = {
        Info:
        { 
        'hashedOthentSub':hashedOthentSub
        },
        request:'PIN',
    }
    return await fetch('https://api2.onairos.uk/getAccountInfoFromOthentSub', {
    // return await fetch('http://localhost:8080/getAccountInfoFromOthentSub', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        },
        body: JSON.stringify(jsonData),
    }).then(response => response.json())
    .then(data => {
        return data;
    })
    .catch(error => console.error(error));
};


