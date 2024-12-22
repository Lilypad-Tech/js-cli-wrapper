const exec = require("child_process").exec
const express = require("express")
const os = require("os")
const archiver = require('archiver');
const path = require('path');
const fs = require('fs');

const port = process.env.PORT || 3000
const app = express()

// middleware
app.use(express.json())

// routes
app.get("/ping", (req, res) => {
  res.send("pong")
})

app.get("/clean", (req, res) => {
  const cmd = `rm -rf /tmp/lilypad/data/*`
  exec(cmd, { env: { ...process.env } }, function (error, stdout, stderr) {
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
  console.log('Request received:', {
    moduleRequested: module,
    inputsRequested: inputs,
    streamRequested: stream
  })

  if (!pk) {
    res.json({ error: "Missing private key" }).end()
    return
  }

  if (!module) {
    res.json({ error: "Missing module name" }).end()
    return
  }

  const cmd = `lilypad run -n demonet ${module}${!!inputs ? ` ${inputs}` : ""}`
  const env = {
    env: {
      PATH: process.env.PATH,
      WEB3_PRIVATE_KEY: pk    
    }
  }

  console.log('Executing command:', cmd)
  console.log('Environment:', { env: { 
    ...env.env,
    WEB3_PRIVATE_KEY: "[hidden]",
    PATH: env.env.PATH 
  }})

  exec(cmd, env, function (error, stdout, stderr) {
    console.log("=== Command Output ===")
    console.log("stdout:", stdout)
    console.log("stderr:", stderr)
    if (error) {
      console.error("Execution error:", error)
      res.json({ error, details: stderr }).end()
      return
    }
    const open = stdout.split("\n").find((line) => line.includes("open /tmp"))
    const pathToResult = open.trim().split(" ")[1]

    res.setHeader('Content-Type', 'application/x-tar');
    res.setHeader('Content-Disposition', 'attachment; filename='+getLastFolderName(pathToResult)+'.tar');

    const archive = archiver('tar', {
      zlib: { level: 9 } // Sets the compression level
    });
    
    archive.on('error', function(err) {
      res.status(500).send({ error: err.message });
    });
    
    archive.pipe(res);
    archive.directory(pathToResult,getLastFolderName(pathToResult));
    archive.finalize();
    return;
  })
})
function getLastFolderName(dirPath) {
  // Remove trailing slash if exists
  const normalizedPath = dirPath.replace(/\/+$/, '');
  return path.basename(normalizedPath);
}
app.listen(port, () => {
  console.log(`Lilypad wrapper listening on port ${port}`)
})