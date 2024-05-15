const exec = require("child_process").exec
const express = require("express")
const os = require("os")

const port = 3000
const app = express()

// middleware
app.use(express.json())

// routes
app.get("/ping", (req, res) => {
  res.send("pong")
})

app.get("/clean", (req, res) => {
  const cmd = `rm -rf /tmp/lilypad/data/*`
  exec(cmd, function (error, stdout, stderr) {
    res.json({ error, stdout, stderr }).end()
  })
})

app.post("/", (req, res) => {
  req.setTimeout(0)
  const {
    pk = "",
    module = "",
    inputs = "",
    opts: { stream } = { stream: false },
  } = req.body
  console.log({ module, inputs, stream })

  if (!pk) {
    res.json({ error: "Mising private key" }).end()
    return
  }

  if (!module) {
    res.json({ error: "Mising module name" }).end()
    return
  }

  cmd = `lilypad run ${module}${!!inputs ? ` -i ${inputs}` : ""}`
  env = { env: { WEB3_PRIVATE_KEY: pk } }

  exec(cmd, env, function (error, stdout, stderr) {
    console.log("stdout: " + stdout)
    console.log("stderr: " + stderr)
    console.log("error: " + error)

    if (error) {
      res.json({ error }).end()
      return
    }

    if (stream) {
      const open = stdout.split("\n").find((line) => line.includes("open /tmp"))
      const [folder] = open
        .split(" ")
        .map((line) => line.trim())
        .reverse()
      const result = stdout ? "stdout" : "stderr"
      const path = `${folder}/${result}`
      res.download(path, "result")
      return
    }

    const url = stdout
      .split("\n")
      .find((line) => line.includes("https://ipfs.io"))
      .trim()
    const [cid] = url.split("/").reverse()
    res.json({ url, cid }).end()
  })
})

app.listen(port, () => {
  console.log(`Lilypad wrapper listening on port ${port}`)
})
