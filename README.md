# JS Lilypad cli wrapper

An API endpoint that wraps using the Lilypad cli.

## Prerequisites

### Installing and Setting up Lilypad Binary

1. Build the Lilypad binary:

```bash
git clone https://github.com/Lilypad-Tech/lilypad
cd lilypad
go build -v -o lilypad

# For Linux: Move to /usr/bin
sudo mv lilypad /usr/bin/

# For Mac: Move to /usr/local/bin
sudo mv lilypad /usr/local/bin
```



## Usage

Run `node src/index.js` to create a local endpoint using the js wrapper with either `src/run.js` or `src/stream.js`, then send a post request containing json with your funded `WEB3_PRIVATE_KEY` key set, see the quick start for more on [getting started](https://docs.lilypad.tech/lilypad/lilypad-milky-way-testnet/quick-start)

In `inputs`, each input must be preceeded by the `-i` flag, including tunables. For example:
`"inputs": "-i Prompt='an astronaut floating against a white background' -i Steps=50"`

The endpoint can then be tested using curl
```
curl -X POST http://localhost:3000 \
-H "Content-Type: application/json" \
-d '{"pk": "'"b3994e7660abe5f65f729bb64163c6cd6b7d0b1a8c67881a7346e3e8c7f026f5"'", "module": "github.com/lilypad-tech/lilypad-module-lilysay:0.1.0", "inputs": "-i Message=test"}'
```

```js
// run.js
const { run } = require("./")

run(
  "private-key",
  "module name"
  '-i payload (key=value)'
).then((res) => {
  console.log(res)
})
```

```js
// stream.js
const { stream } = require("./")

stream(
  "private-key",
  "module name"
  '-i payload (key=value)'
  { stream: true },
).then(() => {
  console.log("Result in ./output/result")
})
```

```js
// index.js
const fetch = require("node-fetch")
const fs = require("fs")

const URL = "http://js-cli-wrapper.lilypad.tech"
const METHOD = "POST"
const HEADERS = {
  Accept: "application/json",
  "Content-Type": "application/json",
}
const OUTPUT = "./output"

function stream(pk, module, inputs, opts) {
  const body = JSON.stringify({ pk, module, inputs, opts })

  return fetch(URL, {
    headers: HEADERS,
    method: METHOD,
    body,
  }).then(function (res) {
    const fileStream = fs.createWriteStream(`./${OUTPUT}/result`)
    res.body.pipe(fileStream)
    res.body.on("error", (error) => {
      return { error }
    })
    fileStream.on("finish", () => {
      return { status: "done" }
    })
  })
}

function run(pk, module, inputs) {
  const body = JSON.stringify({ pk, module, inputs })

  return fetch(URL, {
    headers: HEADERS,
    method: METHOD,
    body,
  }).then((raw) => raw.json())
}

module.exports = { run, stream }
```
