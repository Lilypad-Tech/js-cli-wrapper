import { exec } from "child_process"
import express from "express"
import os from "os"
import archiver from "archiver"
import path from "path"
import fs from "fs"
import toml from "toml"
import tar from "tar-stream"
import { create } from "ipfs-http-client"
import cors from "cors"

const downloadAndSaveToml = async (path) => {
  return new Promise(async (resolve, reject) => {
  try {
    const response = await fetch(path);
    const tomlText = await response.text();
    const parsedToml = toml.parse(tomlText);

    function flattenObject(obj, parentKey = '', result = {}) {
      for (const [key, value] of Object.entries(obj)) {
        const newKey = parentKey ? `${parentKey}_${key}` : key;
        if (typeof value === 'object' && !Array.isArray(value)) {
          flattenObject(value, newKey, result);
        } else {
          result[newKey] = value;
        }
      }
      return result;
    }

    const flattenedToml = flattenObject(parsedToml);

    var envs = {}
    for (const [key, value] of Object.entries(flattenedToml)) {
      envs[key.toUpperCase()] = value;
    }

    // console.log(envs)
    console.log('TOML keys and values saved to local storage');
    //switchNetwork();
    resolve(envs);
  } catch (error) {
    console.error('Error fetching or parsing TOML file:', error);
  }
})
}

// console.log(envs)
// const exec = require("child_process").exec
// const express = require("express")
// const os = require("os")
// const archiver = require('archiver');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');

const port = process.env.PORT || 3000
const app = express()

app.use(cors());
// middleware
app.use(express.json())
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});
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

app.post("/", async (req, res) => {
  req.setTimeout(0)
  const {
    pk = "",
    module = "",
    inputs = "",
    opts: { stream } = { stream: false },
    format = "tar"
  } = req.body
  console.log('Request received:', {
    moduleRequested: module,
    inputsRequested: inputs,
    streamRequested: stream,
    format: format
  })
  console.log("body", req.body)

  if (!pk) {
    res.json({ error: "Missing private key" }).end()
    return
  }

  if (!module) {
    res.json({ error: "Missing module name" }).end()
    return
  }

  console.log("format", format)
 
  const cmd = `lilypad run -n demonet  ${module}${!!inputs ? ` ${inputs}` : ""}`
  const env = {
    env: {
      PATH: process.env.PATH,
      WEB3_PRIVATE_KEY: pk    
    }
  }
  // const envs = await downloadAndSaveToml("https://raw.githubusercontent.com/arsen3d/orbit/refs/heads/main/config.toml")//https://raw.githubusercontent.com/arsenum/Demonet/refs/heads/main/config.toml")
  // Object.assign(env.env, envs);
  // console.log(envs);
  console.log('Executing command:', cmd)
  console.log('Environment:', { env: { 
    ...env.env,
    WEB3_PRIVATE_KEY: env.env.WEB3_PRIVATE_KEY,
    PATH: env.env.PATH 
  }})
  async function handleTarRequest(res, pathToResult) {
    res.setHeader('Content-Type', 'application/x-tar');
    res.setHeader('Content-Disposition', 'attachment; filename=' + getLastFolderName(pathToResult) + '.tar');

    const archive = archiver('tar', {
      zlib: { level: 9 } // Sets the compression level
    });

    archive.on('error', function (err) {
      res.status(500).send({ error: err.message });
    });

    archive.pipe(res);
    archive.directory(pathToResult, getLastFolderName(pathToResult));
    archive.finalize();
  }
  async function handleIpfsRequest(res, pathToResult) {
    res.setHeader('Content-Type', 'application/json');
    const ipfs = create({ url: 'http://localhost:5001' });

    async function addDirectoryToIpfs(dir) {
      const files = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const subDirFiles = await addDirectoryToIpfs(fullPath);
          files.push(...subDirFiles);
        } else {
          const fileContent = fs.readFileSync(fullPath);
          files.push({
            path: path.relative(pathToResult, fullPath),
            content: fileContent
          });
        }
      }
      return files;
    }

    try {
      const filesToAdd = await addDirectoryToIpfs(pathToResult);
      const results = [];
      const parentDir = getLastFolderName(pathToResult);
      const wrappedFiles = filesToAdd.map(file => ({
        path: path.join(parentDir, file.path),
        content: file.content
      }));

      for await (const file of ipfs.addAll(wrappedFiles)) {
        results.push({
          path: file.path,
          cid: file.cid.toString()
        });
      }
      res.json({ results });
    } catch (err) {
      console.log("Error adding files to IPFS:", err);
      res.status(500).json({ error: err.message });
    }
  }
  async function  handleJsonRequest(res,pathToResult) {
    res.setHeader('Content-Type', 'application/json');
    // res.setHeader('Content-Disposition', 'attachment; filename=' + getLastFolderName(pathToResult) + '.json');
    const files = {};

    function readFilesRecursively(dir) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        readFilesRecursively(fullPath);
      } else {
        const fileContent = fs.readFileSync(fullPath, 'base64');
        const relativePath = path.relative(pathToResult, fullPath);
        files[relativePath] = fileContent;
      }
      });
    }

   
    readFilesRecursively(pathToResult);
    console.log("files",files)
    res.json(files).end();
    return files;
  }
  // handleJsonRequest(res,"/tmp/lilypad/data/downloaded-files/Qmextu4cfu96UTza5rapVu81wksXMgquhWJom3DjnhgpVd")
  
  // return;
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

    switch(format){
      case "ipfs":
        handleIpfsRequest(res,pathToResult)
        break;
      case "tar":
        handleTarRequest(res,pathToResult)
        break;
      case "json":
        handleJsonRequest(res,pathToResult)
        break;
      default:
        handleTarRequest(res,pathToResult)
        break;
    }
    // handleTarRequest(pathToResult);
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