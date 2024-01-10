// Function to convert PEM encoded public key to a format usable by the Web Crypto API
function pemToBuffer(pem) {
    // Remove the first and last lines (headers), and all line breaks
    const base64String = pem
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');  // remove all whitespace, not just line breaks
    const binaryString = window.atob(base64String);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

// Function to encrypt data using RSA
export async function rsaEncrypt(publicKeyPem, data) {
    try {
        console.log("Converting PEM to ArrayBuffer...");
        const publicKeyBuffer = pemToBuffer(publicKeyPem);
        console.log("Importing key...");
        const importedKey = await window.crypto.subtle.importKey(
            'spki',
            publicKeyBuffer,
            {
                name: 'RSA-OAEP',
                hash: {name: 'SHA-256'}
            },
            true,
            ['encrypt']
        );
        console.log("Encrypting data... : ", data);
        const encrypted = await window.crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            importedKey,
            new TextEncoder().encode(data)
        );
        console.log("Conversion to Base64...");
        return bufferToBase64(encrypted);
    } catch (error) {
        console.error("rsaEncrypt error:", error);
        return null;
    }
}

// Function to convert ArrayBuffer to Base64
function bufferToBase64(buffer) {
    try{
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }catch(e){
        console.error("Eror in buffertoBase64 : ", e)
    }
}


