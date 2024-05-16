# JS Lilypad cli wrapper

An API endpoint that wraps using the Lilypad cli.


## Usage

`node src/run.js` or `node src/stream.js`

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
