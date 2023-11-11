
## Onairos Developer Documentation v0.0.0

### 1. Create a Developer Account

Create a Developer account and retrieve your Onairos developer ID and access token

https://Onairos.uk/dev-board

### 2. Download the Onairos NPM package

```bash
npm install onairos
```

### 3. Setup the Onairos Connection Object

First create the Request Object which Users will Authorize (or not) in the extension popup
```json
"RequestObject":{ 
    "Small": {
      "type":"Personality",
      "descriptions":"Insight into your Interests",
      "reward":"10% Discount"
    },
    "Medium":{
      "type":"Personality",
      "descriptions":"Insight into your Interests",
      "reward":"2 USDC"
    },
    "Large":{
      "type":"Personality",
      "descriptions":"Insight into your Interests",
      "reward":"2 USDC"
    }
  }

```
RequestObject.size key:
Small - Upto 16 inference items
Medium - Upto 32 inference items
Large - Upto 64 inference items

type: Only the Personality key is valid at this time (represents the users Onairos Personality)
description: Description to display to users about your request
reward: Reward Given to User for granting Data Request

  Then instantiate the Onairos object from the Onairos package - passing in your Onairos Developer ID and your Request Object
  ```jsx
  <Onairos requestData={requestData} onairosID={onairosID} access_token={access_token} webpageName={webpageName} proofMode={proofMode} />
  ```

  Onairos Object fields:
  requestData - Request Object - Json
  onairosID - App Assigned Onairos ID - String
  access_token - App Assigned Access Token - String
  webpageName - App Display Name - String 
  proofMode - Wish to recieve ZK proof after recieving Data , default FALSE - boolean

That is all for the initial setup

### 4. Recieving the Inference API

Once the user has clicked to Connect their Onairos account and authroized their data, you will recieve the Inference API via window.sendMessage with the following event types:
```jsx
event.data.source === 'content-script'
&&
event.data.type === 'API_URL_RESPONSE'
```

For example:

``` jsx
export default async function UseAPIURL(event){
    if (event.data && event.data.source === 'content-script' && event.data.type === 'API_URL_RESPONSE') {
      //Fetch Onairos Data from Returned API url
  }
}
useEffect(() => {
  window.addEventListener('message', UseAPIURL);
  return () => {
    window.removeEventListener('message', UseAPIURL);
  };
}, []);
```

## Using the Inference API

The Inference API provides a machine learning model that can generate predictions based on the provided data. This documentation will guide you on how to properly format your input for the API and interpret the results received from the API.

### 5. Input Format

Send a POST request to the API endpoint with a JSON payload containing a set of entries for prediction. Each entry should include the following information:

- `text`: The text input for the inference result (String) - required
- `category`: The category to which the content belongs (String) - required
- `img_url`: The URL of an image associated with the content (String) - optional

Example JSON body for the POST request:

```json

  "Input": {
    "input1": {
      "text": "Example text input 1",
      "category": "Example Category 1",
      "img_url": "http://example.com/image1.jpg"
    },
    "input2": {
      "text": "Example text input 2",
      "category": "Example Category 2",
      "img_url": "http://example.com/image2.jpg"
    },
    "input3": {
      "text": "Example text input 3",
      "category": "Example Category 3",
      "img_url": "http://example.com/image3.jpg"
    }
  }
    // Additional entries can be added here
  

```

You can then call the Inference API with the Inference object created above

```jsx
export default async function UseAPIURL(event){
    if (event.data && event.data.source === 'content-script' && event.data.type === 'API_URL_RESPONSE') {
      const apiUrl = event.data.APIurl;
      await fetch(apiUrl, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(InputData),
      }).then(async (data)=>{
            // process Onairos Data
      })
      .catch(error => console.error(error));
      
    }}
  
```

### 6. Output Format

The API responds with a JSON object containing an `output` field. This field is an array of arrays, where each sub-array contains a single element representing the prediction score from the model. This score is a floating-point number reflecting the model's confidence for the input provided.

Example of the output format:

```json
{
  "output": [
    [[0.9998]],
    [[0.9999]],
    [[0.9922]],
    [[0.0013]],
    // Additional scores for more entries
  ]
}
```

Each score is deeply nested within two arrays to maintain compatibility with batch processing systems that may require this format.

### Interpretation of Output

- A score close to `1` indicates a high confidence level in the prediction.
- A score close to `0` indicates a low confidence level in the prediction.
- The sequence of scores corresponds to the order of the input entries.

### Example Usage in a React Application

The following React component demonstrates how to send a prediction request to the API and display the results:

```jsx
import React, { useState } from 'react';

function App() {

    async function UseAPIURL(event){
     if (event.data && event.data.source === 'content-script' && event.data.type === 'API_URL_RESPONSE') {
       const apiUrl = event.data.APIurl;
       await fetch(apiUrl, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json',
           },
           body: JSON.stringify(InputData),
       }).then(async (data)=>{
             // process Onairos Data
       })
       .catch(error => console.error(error));
      
    }}

  const sendData = {
    interestModel: {
      title:'Interest',
      descriptions:"Insight into your Interests",
      reward:"10% Discount"
    },
    personalityModel:{
      title:'Personality',
      descriptions:"Insight into your Interests",
      reward:"2 USDC"
    },
    intelectModel:{
      title:'Intellect',
      descriptions:"Insight into your Interests",
      reward:"2 USDC"
    },
  };
  useEffect(() => {
    window.addEventListener('message', UseAPIURL);
    return () => {
      window.removeEventListener('message', UseAPIURL);
    };
    }, []);

  const onairosID = 'test';
  return (
      <Onairos sendData={sendData} onairosID={onairosID} />
  );
}
export default InferenceComponent;

