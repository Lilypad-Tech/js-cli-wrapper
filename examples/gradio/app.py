import gradio as gr
import os
import requests
import tempfile
import tarfile
WEB3_PRIVATE_KEY = os.getenv("WEB3_PRIVATE_KEY", "")


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
    # with gr.Blocks():
    #     with gr.Row():
    #         with gr.Column():
    #             gr.Label("Select a module to run")
    #         with gr.Column():    
    #             gr.Label("Select a module to run")
    # gr.Image(value="app/gradio.svg", type="pil"),
    dropdown = gr.Dropdown([
        ("Cowsay","cowsay:v0.0.4,Message"), 
         ("SDXL","github.com/noryev/module-sdxl-ipfs:ae17e969cadab1c53d7cabab1927bb403f02fd2a,prompt"), 
         ("Llama","github.com/noryev/module-llama2:main,prompt")],
        label="Dropdown",
        # value="Message",
        interactive=True
    )
    inp = gr.Textbox(label="Input",placeholder="Prompt!!!")
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