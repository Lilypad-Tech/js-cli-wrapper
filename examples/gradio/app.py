import gradio as gr
import os
import requests
import tempfile
import tarfile
from web3 import Web3

WEB3_PRIVATE_KEY = os.getenv("WEB3_PRIVATE_KEY", "")

# Connect to the RPC endpoint
web3 = Web3(Web3.HTTPProvider('https://demonet-chain-http.lilypad.tech'))
account = web3.eth.account.from_key(WEB3_PRIVATE_KEY)
wallet_address = account.address
# ERC20 contract address and ABI
contract_address = '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853'
contract_abi = [
    {
        "constant": True,
        "inputs": [{"name": "_owner", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "balance", "type": "uint256"}],
        "type": "function",
    }
]

# Create contract instance
contract = web3.eth.contract(address=contract_address, abi=contract_abi)


def get_balance(wallet_address):
    try:
        balance_wei = contract.functions.balanceOf(wallet_address).call()
        balance_eth = Web3.from_wei(balance_wei, 'ether')
        return f"{balance_eth:.5f} LP"
    except Exception as e:
        return f"Error: {str(e)}"

head = f"""
    <script src="/gradio_api/file=app/app.js"></script>
    <link rel="stylesheet" href="/gradio_api/file=app/app.css">
"""

def ping():
    response = requests.get("http://cli-wrapper:3000/ping")
    if response.status_code == 200:
        print("Successfully fetched the webpage")
    else:
        print("Failed to fetch the webpage")
    return gr.Textbox(value="test", visible=True),gr.Textbox(visible=True),gr.File(visible=True)

def run(dropdown,prompt,progress=gr.Progress()):
    payload = {
        "pk":  WEB3_PRIVATE_KEY ,
        "module": dropdown.split(",")[0],
        "inputs": "-i \""+dropdown.split(",")[1]+"=" + prompt + "\"",
        "stream": "true"
    }
    response = requests.post("http://cli-wrapper:3000", json=payload)
    if response.status_code == 200:
        print("Successfully fetched the webpage")
    else:
        print("Failed to fetch the webpage")
    temp_dir = tempfile.mkdtemp()
    content_disposition = response.headers.get('content-disposition')
    # if content_disposition:
    filename = content_disposition.split('filename=')[1].strip('"')
    progress(0.5, desc="Processing...")
    
    temp_path = os.path.join(temp_dir,filename)
    with open(temp_path, 'wb') as f:
        f.write(response.content)
    
    stdout_content = ""
    stderr_content = ""
    progress(0.75, desc="Amost done...")
    with tarfile.open(temp_path, 'r') as tar:
        for member in tar.getmembers():
            f = tar.extractfile(member)
            if f:
                if member.name.endswith('stdout'):
                    content = f.read().decode('utf-8')
                    stdout_content = content
                elif member.name.endswith('stderr'):
                    content = f.read().decode('utf-8')
                    stderr_content = content
            tar.extractall(temp_dir)
            image_path = temp_dir + "/" +os.path.splitext(filename)[0] + "/outputs/output.png"
    return (gr.Textbox(value=stdout_content,visible=len(stdout_content)) ,
            gr.Textbox(value=stderr_content,visible=(len(stderr_content)>0)),
            gr.File(value=temp_path, visible=True),
            gr.Textbox(),
            gr.Image(value=image_path , visible=os.path.exists(image_path))
            )
gr.set_static_paths(paths=["app"])    

with gr.Blocks(head=head) as demo:
    progress = gr.Progress()
    with gr.Blocks():
        with gr.Row():
            with gr.Column(scale=1):
                gr.Label( label="LP Balance",  value=get_balance(wallet_address))
            with gr.Column(scale=1):    
                balance_wei = web3.eth.get_balance(wallet_address)
                balance_eth = Web3.from_wei(balance_wei, 'ether')
                gr.Label(label="ETH Balance", value=f"{balance_eth:.5f} ETH")
            with gr.Column(scale=5):    
                gr.Label(label="Wallet Address", value=wallet_address)
    dropdown = gr.Dropdown([
        ("Cowsay","cowsay:v0.0.4,Message"), 
         ("SDXL","github.com/noryev/module-sdxl-ipfs:ae17e969cadab1c53d7cabab1927bb403f02fd2a,prompt"), 
         ("Llama","github.com/noryev/module-llama2:main,prompt")],
        label="Dropdown",
        # value="Message",
        interactive=True
    )
    inp = gr.Textbox(label="Input", placeholder="Enter wallet address")
    run_button = gr.Button("Run")
    image = gr.Image( visible=False)
    file = gr.File( visible=False)
    out = gr.Textbox(        
        visible=False,
        label="Output",
        text_align="left",
        container=True,
        scale=1,
        # lines=10,
        elem_classes=["monospace"],
        show_copy_button=True)
    err = gr.Textbox(label="Error", visible=False,)

    def on_run_click(wallet_address):
        balance = get_balance(wallet_address)
        return balance

    run_button.click(
        show_api=False,
        fn=lambda: (gr.Button(interactive=False), gr.Textbox(visible=False), gr.Textbox(visible=False), gr.File(visible=False),gr.Image(visible=False)),  # Disable button first
        outputs=[run_button,out,err,file,image]
    ).then(
        fn=run,  # Main function
        inputs=[dropdown, inp],
        outputs=[out, err, file,inp,image]
    ).then(
        show_api=False,
        fn=lambda: gr.Button(interactive=True),  # Re-enable button
        outputs=[run_button]
    )
demo.launch( server_name="0.0.0.0", server_port=7860, share=True,  show_error=True)