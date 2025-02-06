# Example Use Cases
There are many ways to run jobs on lilypad network. The platform is flexible and can accomonodate various use cases.

## CLI Client
The simpelest way is to run a basic job through the CLI directly from terminal.
The parameters are path to the module definition, which is usually hosted on github and inputs to be processed by the module, which are passed in directly in CLI.

The CLI works on Linux, Mac and Windows. When running from Windows, WSL must be used.


The CLI is intended for doing basic testing of the system. To build production grade applications and workflows, additional tooling is useful to provide a comprihensive solution to just about any process.

## CLI Live Client
Lilypad can be used to serve application before the job completes. For example you may want to run an LLM model, but instead of waiting for the module to complete the job, you would recive link to a URL that can be used in another application to perform inferance from an application running locally.  This can include desktop tools such as Rivet or AnythingLLM. These tools allow users to configure endpoints the application would use. For example a link to OpenAI or Anthropic. The difference is that these services charge users for each token input and output. When using Lilypad you get back a URL that works the same way. The user pays one time for starting the module and then uses it as much as they want without having to pay for each token going in or out.

This approach works the same way when wanting to use a desktop app such is krita, which is like open source photoshop. It has a plugin that allows users to generate AI content using ComfyUI endpoint. To accomplish this, a Lilypad ComfyUI module would be used to start the ComfyUI server as a module job. The user would receive a response with a URL, which in turn would be used to configure Krita. This workflow would enable the locally running application to utilize a powerful GPU running off site.

In order for a Lilypad module to serve up a live server of the model running on it several components are required.
1. A publically accessible socket server, which will be used to return the url of the running module
2. A publically accessible proxy server, which will be used to proxy the requests between Client and Lilypad Module.

The client will have a unique ID, which it will use as a callback parameter to the module. When the module loads it will use this parameter to create a unique URL. 

The URL is not limited to beign an API Endpoint. The module may run a server capable of serving up Web Application as well. It could be a React App, Gradio App or anything else that can run in a browser. 


## API Client
While Lilypad has a publicaly accessible API, for maximum flexibility it makes sense to host your own endpoint. It's open source and extendible to suite your needs. 
This makes sense sense if you want custom payment or authentication logic. The api provides an easy to use rest interface to submit jobs. You pass it path to the module repository, parameters, and how you want to receive the response. The options are IPFS, JSON or Tar file. If you expect the response to be under 1 Megabyte, working with a JSON makes sense. It's an easy way to get data with minimal requirements. If the response includes binary files, they are encoded in base64. 

When you specify the response to be a tar file, it is expected that your client application would have a way of decompressing and extracting the contents. If doing this in the browser, it will mean that the application will have node.js depndencies that enable you to do this. For example tar-stream package can be used to accomplish this. The contents can be kept in memory, session storage, local storage, or indexedDB. These options are built directly in to the browser.

Once the result is downloaded and extracted, the data is available on the client to do as you wish it.

If you specify IPFS to be the response, the API will return a CID, which can in turn be used to download the contents from an IPFS Daemon such as Kubo via fetch function or Helia package can be used to download the contents via P2P using the libary.
Example:
```
import { createHelia } from 'helia'
import { strings } from '@helia/strings'
function GetContent(CID){
    const helia = await createHelia()
    const s = strings(helia)
    console.log(await s.get(CID))
}
```





## Web3 Client
User who want to build decentralized Web3 Native applications can interact with Lilypad directly onchain through a Solidity Smart Contract. This apparoch usualy works in browser utilizing metamask to launch Lilypad Jobs. The prerequiste is that the chain the user uses needs to have Lilypad Smart Contracts deployed.  
See link for contract definition:
https://github.com/Lilypad-Tech/lilypad/blob/6e16b720517728939c92a4a7f3490a48860a2a5f/hardhat/contracts/LilypadOnChainJobCreator.sol#L72
```
function runJob(
    // what is the module name we are making an offer for
    string memory module,
    // an array of key=value pairs that will be the inputs to the job
    string[] memory inputs,
    // the address of the client who is paying for the job
    // they must have called the increaseAllowance function
    // giving the controller (i.e. solver) permission to spend their tokens
    address payee
  )
```
When this contract is deployed along with other supporting contracts, a contract address is returned. Prior to deployment, the contract is compiled, which generates an ABI file. 
Both ABI and Contract address are used by Ethers package library to create an object on the client, which is able to run the job on chain.
Ethers triggers metamask to approve the transaction. In addition to payment, the transaction contains the path to the module and input parameters. 

What happends after the job is started is completely up to the application developer to implement. The module may use sockets to call back the browser dapp with further workflows.
It can be as simple as confirming that a job has started or as complex as serving up a 3d Game that is rendered in the module and streamed back to the client using pixel streaming. 
Another possibility is having the broswer prompt the user to open a desktop application with a connecting string that points to the running module.


## Rivet Client
Lilypad supports multi-agent workflows that are comprised of multiple modules. It's best to use CIDs as inputs and outputs to pass data between each stage.
The desktop app can be downloaded from https://github.com/Ironclad/rivet
To simplify interacting with Lilypad a plugin was created that can be configured to specify modules that are part of the workflow. The plugin has a configuration screen where a private key is set, which is needed to run modules on Lilypad Network. Rivet provides a GUI interface for creating module nodes that are linked together to accomplish a goal. The GUI has a Run button that lets developer build out their workflow. When the developer is satisfied with the results produced by the diagram created in Rivet, the file can be saved and included in a production application that serves up the workflow in a custom application.

Example:
```
export async function runRivetGraph(graphId: GraphId, inputs?: GraphInputs): Promise<GraphOutputs> {
  const project = currentDebuggerState.uploadedProject ?? await loadProjectFromFile('../chat.rivet-project');

  const outputs = await runGraph(project, {
    graph: graphId,
    openAiKey: env.OPENAI_API_KEY as string,
    inputs,
    remoteDebugger: rivetDebuggerServerState.server ?? undefined,
    externalFunctions: {
      calculate: async (_context: any, calculationStr: any) => {
        if (typeof calculationStr !== 'string') {
          throw Error('expected a string input');
        }
        const value = calculateExpression(calculationStr);
        if (value) {
          return {
            type: 'number',
            value,
          };
        } else {
          return {
            type: 'string',
            value: 'Error calculating',
          };
        }
      },
    },
  });

  return outputs;
}
```


## GPU Client
It's possible to run Juice Labs client that will emulate a local GPU that is in fact running remotely. To accomplish this download Juice Client from https://github.com/Juice-Labs/Juice-Labs/releases There is a binary called juicify which takes a --address option. The address would be a URL returned from the module. While the module is running, it is executing a process in agent binary, available from the link above. This executable is serving up the GPU over IP.
Server Example:
```
C:\Users\arsen\Downloads\JuiceServer-windows>agent.exe
2025/01/28 23:20:52 Info: Juice Agent, v0.0.0
2025/01/28 23:20:52 Warning: TLS is disabled, data will be unencrypted
2025/01/28 23:20:53 Info: GPUs
2025/01/28 23:20:53 Info:   0 @ 00000000:01:00.0: NVIDIA GeForce RTX 4090 24564MB
```

Client Example:
```
/pytorch $ python print_cuda_devices.py
No CUDA devices found
/pytorch $ jucify python print_cuda_devices.py
Juice + [NVIDIA GeForce RTX 4090 24564MB]
/pytorch $ jucify python stable-diffusion.py "A cat wearing sunglasses" cat.jpg
/pytorch $ display cat.jpg
```


## IPFS Parameters
The API is limited to text input. While binary content can be encoded as base64, this is not practical for larger files.
If passing in large files or directories to the module is a requirement, IPFS is a greate distributed solution to accomplish this.
There are several options.
1. You can run an IPFS Daemon which offers a REST api for adding files to it. This can be done direcly from the browser application using built in fetch function available in all modern browsers. The user would browser for a file or a directory locally and post the contents to IPFS Daemon. In turn it would respond with the CID, which would then be used as input parameter to the module.

2. To avoid having to host IPFS Damon, Helia package can be used in your Node.js app to accomplish the same thing.
Example:
```
import { createHelia } from 'helia'
import { json } from '@helia/json'

const helia = await createHelia()
const j = json(helia)

const myImmutableAddress = await j.add({ hello: 'world' })

console.log(myImmutableAddress)
// { link: CID(baguqeerasor...) }
```
The CID would would be used as an input parameters to the module.

## SDK (REST and WEB3)
- Python
- Go
- Javascript 

# Auxilary Services
- API Server: Used to start a module using REST API
- Job Creator: Used to start a module using Smart Contract
- Proxy Server: Used to allow the user to communicate with the module at Runtime
- Socket Server: Used to allow the user to setup initial connection and encryption key exchange.
- IPFS Server: Used to pass large files to module
- Nginx Server: Used to broker auxilary services
- Coudflare Tunnel: Used to allow incomming connections to docker container without having to open up router ports.
- Dashboard: Used to get tokens and api key
