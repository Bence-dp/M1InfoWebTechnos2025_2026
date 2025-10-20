import express from "express";  
import fs from "node:fs/promises";
import path from "path";
import { fileURLToPath } from "node:url";

const app = express();

// Static files are located in the public folder
const __filename = fileURLToPath(import.meta.url);
console.log("import.meta.url = " + import.meta.url)
console.log("__filename = " + __filename);
const __dirname = path.dirname(__filename);
console.log("__dirname = " + __dirname);

// PUBLIC_DIR: env var wins, else ../public (absolute path)
// --------- Cross-platform paths (Mac/Linux/Windows) ---------

export const PUBLIC_DIR = process.env.PUBLIC_DIR
  ? path.resolve(process.env.PUBLIC_DIR)
  : path.resolve(__dirname, "public");

  console.log("PUBLIC_DIR = " + PUBLIC_DIR);

// DATA_DIR: env var wins, else <PUBLIC_DIR>/presets
export const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(PUBLIC_DIR, "presets");

  console.log("DATA_DIR = " + DATA_DIR)

// We tell express to use the public folder for static files
app.use(express.static(PUBLIC_DIR));

// let's define a route for the preset files
app.get("/api/presets", async (req, res) => {
  // 1 we want to return the array of preset JSON files
    const files = await fs.readdir(DATA_DIR);
    // 2We want only the .json files. Let's filter the array
    const jsonFiles = files.filter(file => file.endsWith(".json"));

    let promiseArray = [];

    // 3 We want to return an array of objects 
    // corresponding to each JSON file content
    for (let i = 0; i < jsonFiles.length; i++) {
        // Read the file content. We need first compute the
        // full path of the file
        //const filePath = PRESET_DIR + "/" + jsonFiles[i];
        const filePath = path.join(DATA_DIR, jsonFiles[i]);
        // Read the file content
        const promise = JSON.parse(await fs.readFile(filePath, "utf8"))
        promiseArray.push(promise);
    }

    // Execute a set of promises and wait for all to be completed
    // before returning the result
    const result = await Promise.all(promiseArray);
    res.json(result);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});