import {  useState, useEffect } from 'react'
import reactImageUrl from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { Client } from "@gradio/client";

function App() {
  const [dropdownValue, setDropdownValue] = useState("cowsay:v0.0.4,Message")
  const [prmoptValue, setPromptValue] = useState("Hello!!")
  const [message, setMessage] = useState("Hello!!")
  const [imgUrl, setImgUrl] = useState(reactImageUrl)
  const [imageVisible, setImageVisible] = useState(false)
  const [textVisible, setTextVisible] = useState(false)
  useEffect(() => {

   
    // init();
   

    // const client = new Client({
    //   url: "http://localhost:7860",
    // });
    // client.get("https://huggingface.co/facebook/bart-large-cnn").then((response) => {
    //   console.log(response);
    });
    const run = async () => {
      const client = await Client.connect("http://localhost:7860/");
      const result = await client.predict("/run", { 		
          dropdown: dropdownValue, 		
          prompt: prmoptValue, 
      });
      console.log(result.data);
      switch (dropdownValue) {
        case "cowsay:v0.0.4,Message":
          setMessage(result.data[0].value);
          setTextVisible(true);
          setImageVisible(false);
          break;
        case "github.com/noryev/module-sdxl-ipfs:ae17e969cadab1c53d7cabab1927bb403f02fd2a,prompt":
          setImgUrl(result.data[4].value.url);
          setImageVisible(true);
          setTextVisible(false);
          break;
        case "github.com/noryev/module-llama2:main,prompt":
          const log = result.data[1].value.split("- INFO - Response:");
          setMessage(log[log.length - 1]);
          setTextVisible(true);
          setImageVisible(false);
          break;
        default:
          setMessage("Invalid selection");
          setTextVisible(false);
          setImageVisible(false);
          break;
      }
      // setMessage(result.data[0].value);
      // setImgUrl(result.data[4].value.url);
      // result.data.[4].value.url
    }  
  return (
    <>
      <div>
      </div>
      <h1>React / Gradio / CLI Wrapper / CLI Demo</h1>
      <div className="card">
        <select onChange={(e) => setDropdownValue(e.target.value)}>
          <option value="cowsay:v0.0.4,Message">Cowsay</option>
          <option value="github.com/noryev/module-sdxl-ipfs:ae17e969cadab1c53d7cabab1927bb403f02fd2a,prompt">SDXL</option>
          <option value="github.com/noryev/module-llama2:main,prompt">Llama</option>
        </select>
        <input 
          type="text" 
          placeholder="Enter your message" 
          value={prmoptValue}
          onChange={(e) => setPromptValue(e.target.value)} 
        />
        <button onClick={() => run()}> run  </button>
         
      
        <p>
          {imageVisible && <img src={imgUrl}  />}
          {textVisible && (
            <textarea 
              rows="10" 
              cols="39" 
              placeholder="Output will be displayed here" 
              readOnly 
              value={message}
            />
          )}
        </p>
      </div>
      <p className="read-the-docs">
        
      </p>
    </>
  )
}

export default App
