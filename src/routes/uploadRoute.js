import express from "express"
import validationConfig from "../validationConfig.js";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url"; 

const router = express.Router()

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); 


router.post("/api/upload", (req, res) => {
    const {jsonFile, sheetNamesArr} = req.body;
    if (!jsonFile) {
        return res.status(404).json({ success: false, message: "Please upload file, and try again" });
    }
    if (jsonFile.length == 0 || jsonFile[0].length == 0) {
        return res.status(400).json({success:false, message: "Provided file is empty, please insert data in file"})
    }

    // Using default for now but can be changed as required
    const rules = validationConfig.defaultRules

    // worker1 for checking mandatory columns
    const workerPath = path.resolve(__dirname, "../workers/mandatoryCols.js");
    const worker1 = new Worker(workerPath);
    worker1.postMessage({ jsonFile, sheetNamesArr, rules });
    
    worker1.on("message", (errors) => {        
        if (errors.length > 0) {
            return res.status(200).json({success: false, columnError:errors});
        }else{
            return res.status(200).json({success: false, message: "No Errors with columns"});
        }
    });
    

    // %%%%%%%%%%%%%%%%%%%    currently working on these      %%%%%%%%%%%%%%%%%%%%%%%%%% 

    // // after passing mandatory colomn test 
    // // worker2 for validation errors
    
    // const workerPath2 = path.resolve(__dirname, "../workers/validationErr.js");
    // const worker2 = new Worker(workerPath2);
    // worker2.postMessage({ jsonFile, sheetNamesArr });
    
    // worker2.on("message", (errors) => {        
    //     if (errors.length > 0) {
    //         return res.status(200).json({success: false, validationErrors:errors});
    //     }else{
    //         return res.status(200).json({success: true, noErrors:"no error"});
    //     }
    // });
    // worker2.on("error", (error) => {
    //     console.log("Worker error:", error);
    //     return res.status(500).json({ success: false, message: "Error processing file" });
    // });
    
    
    worker1.on("error", (error) => {
        console.log("Worker error:", error);
        return res.status(500).json({ success: false, message: "Error processing file" });
    }); 
});


export default router