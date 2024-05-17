# JS Lilypad cli wrapper

An API endpoint that wraps using the Lilypad cli.


## Usage

Run `node src/index.js` to create a local endpoint using the js wrapper, then send a post request containing json with your funded `WEB3_PRIVATE_KEY` key set, see the quick start for more on [getting started](https://docs.lilypad.tech/lilypad/lilypad-milky-way-testnet/quick-start)

The endpoint can then be tested using curl
```
curl -X POST http://localhost:3000 \
-H "Content-Type: application/json" \
-d '{"pk": "'"$WEB3_PRIVATE_KEY"'", "module": "github.com/lilypad-tech/lilypad-module-lilysay:0.1.0", "inputs": "Message=test"}'
```

Alternatively run `node src/run.js` or `node src/stream.js` with one of the following scripts 

```js
// run.js
const { run } = require("./")

run(
  "private-key",
  "module name"
  'payload (key=value)'
).then((res) => {
  console.log(res)
})
```

```
// stream.js
const { stream } = require("./")

stream(
  "private-key",
  "module name"
  'payload (key=value)'
  { stream: true },
).then(() => {
  console.log("Result in ./output/result")
})
```

```
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