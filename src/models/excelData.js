import mongoose from "mongoose"

const excelData = new mongoose.Schema({
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    verified: { type: String},
});

const ExcelData = mongoose.model("ExcelData", excelData);

export default ExcelData
