import { parentPort } from "worker_threads";
import validationConfig from "../validationConfig.js";
import { parse, isValid } from "date-fns";
import ExcelData from "../models/excelData.js";

// Using default for now but can be changed as required
const rules = validationConfig.defaultRules;

let validationErrors = {};

parentPort.on("message", (data) => {

    const { jsonFile, sheetNamesArr } = data;

    // Looping through all the sheets to check if the mandatory fields are there or not
    for (let i = 0; i < jsonFile.length; i++) {
        const sheetName = sheetNamesArr[i];
        let columnNames;
        try {
            columnNames = Object.keys(jsonFile[i][0]);
        } catch (error) {
            console.log(error);
        }
        
        // looping though each sheets
        for (let j = 0; j < jsonFile[i].length; j++) {
            
            let numOferror = 0
            let data = jsonFile[i][j];
            
            // looping through each data of row
            for (let k = 0; k < columnNames.length; k++) {                
                // cheking for mandatory fileds
                
                if (rules[columnNames[k]].required) {
                    if (!data[columnNames[k]]) {
                        // check if this sheeterror already exists
                        if (!validationErrors[sheetName]) {
                            validationErrors[sheetName] = [];
                        }
                        numOferror += 1
                        const error = {
                            row: data[k].__rowNum__,
                            message: "Required field missing",
                        };
                        validationErrors[sheetName].push(error);
                    }
                }
                
                
                // checking for correct date format
                if (columnNames[k] == "Date") {
                    // console.log(data[columnNames[k]], "hello");
                    try {
                        console.log(data.date);
                        data.Date = new Date(data.Date)
                      } catch (error) {
                        console.log(error);      
                    }
                    const isValidDate = (dateStr) => {
                        const parsedDate = parse(
                            dateStr,
                            "dd-MM-yyyy",
                            new Date()
                        );
                        return isValid(parsedDate);
                    };
                    
                    const rowDate = data[columnNames[k]];
                    const isCorrectFormat = isValidDate(rowDate);
                    if (!isCorrectFormat) {
                        numOferror += 1
                        const error = {
                            row: data.__rowNum__,
                            message: "Date is in invalid format",
                        };
                        validationErrors[sheetName].push(error);
                    }else{
                        const date = new Date()
                        const currentMonth = date.getMonth()
                        if(currentMonth != rowDate.getMonth() || date.getFullYear() != rowDate.getFullYear()){   
                            const error = {
                                row: data.__rowNum__,
                                message: "Date is not in this month",
                            };
                            validationErrors[sheetName].push(error);
                        }
                    }
                }

                // checking for correct Amount format
                if (data[columnNames[k]] == rules.Amount) {
                    data.Amount = Number(data.Amount)
                    console.log(data.Amount);
                    if(Number(data.Amount) == NaN){
                        numOferror += 1
                        const error = {
                            row: data.__rowNum__,
                            message: "Amount is in invalid format",
                        };
                        validationErrors[sheetName].push(error);
                    }
                }
            }
            if(numOferror == 0){
                const dbQuery =async () => {
                    // console.log(data);
                    
                    try {
                        
                        const newdata = new ExcelData({
                            name:data.Name,
                            amount:data.Amount,
                            date:data.Date,
                            verified:data.Verified,
                        })
                        await newdata.save()
                    } catch (error) {
                        // console.log(error);
                    }
                }
                dbQuery()
            }
            
        }
    }

    parentPort.postMessage(validationErrors);
});
