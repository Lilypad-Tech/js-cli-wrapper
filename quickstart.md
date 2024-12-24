# JS Lilypad CLI Wrapper
An API endpoint that wraps using the Lilypad cli. This repo consists of the JS CLI wrapper for Lilypad as well as a Python proxy used to abstract the private key using a Gradio example application. 

This Gradio example can be used to proxy for building react apps and other applications to run AI inference on Lilypad. 

# Prerequisites
- Docker installed and started

# Usage
### Quickstart
- Clone the JS CLI repo

```git clone https://github.com/Lilypad-Tech/js-cli-wrapper```

```cd js-cli-wrapper```

```code .```

- Ensure Docker is running
- Run from menu (F5)

In inputs, each input must be preceeded by the -i flag, including tunables. For example: "inputs": "-i Prompt='an astronaut floating against a white background' -i Steps=50"

# Testing
The endpoint can then be tested using curl

Note: This tool is for demonstration purposes and will be improved upon in the coming weeks for greater scalability. Use the following post request with the WEB3_PRIVATE_KEY in the .env file provided. The wallet/private key below is funded with testnet tokens only and has been setup to simplify the use of this developer tool.

### Curl example
```curl -X POST http://localhost:7860/gradio_api/call/run -s -H "Content-Type: application/json" -d '{
"data": [
"cowsay:v0.0.4,Message",
"Hello!!"
]}' \
  | awk -F'"' '{ print $4}'  \
  | read EVENT_ID; curl -N http://localhost:7860/gradio_api/call/run/$EVENT_ID
```

### Python example
```pip install gradio_client```

```from gradio_client import Client
client = Client("http://localhost:7860/")
result = client.predict(
		dropdown="cowsay:v0.0.4,Message",
		prompt="Hello!!",
		api_name="/run"
)
print(result)
```

### Javascript example
```npm i -D @gradio/client```

```import { Client } from "@gradio/client";
const client = await Client.connect("http://localhost:7860/");
const result = await client.predict("/run", { 		
		dropdown: "cowsay:v0.0.4,Message", 		
		prompt: "Hello!!", 
});

console.log(result.data);
```
