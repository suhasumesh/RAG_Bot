import fs from "fs";
import path from "path";
import { processPdfFile } from "./processPdfFile"; // adjust path if needed

// Folders
const pdfFolder = "C:/Users/Dell/OneDrive - Avaali Solutions Pvt. Ltd/Documents/Innovation/Langchain - Ollama/ollamagpt/RPAPDFs/"; // source folder
const processedFolder = "C:/Users/Dell/OneDrive - Avaali Solutions Pvt. Ltd/Documents/Innovation/Langchain - Ollama/ollamagpt/ProcessedPDF"; // destination folder

// Ensure processed folder exists
if (!fs.existsSync(processedFolder)) {
  fs.mkdirSync(processedFolder, { recursive: true });
}

const runAllPdfs = async () => {
  try {
    const files = fs.readdirSync(pdfFolder);
    const pdfFiles = files.filter(
      (f) => f.toLowerCase().endsWith(".pdf") && !f.startsWith("processed")
    );

    if (pdfFiles.length === 0) {
      console.log("No PDF files found in the folder:", pdfFolder);
      return;
    }

    for (const file of pdfFiles) {
      const filePath = path.join(pdfFolder, file);
      console.log(`\nProcessing file: ${filePath}`);

      await processPdfFile(filePath);

      // Move the file to processed folder
      const destPath = path.join(processedFolder, file);
      fs.renameSync(filePath, destPath);
      console.log(`Moved ${file} to processed folder`);
    }

    console.log("\nAll PDFs processed and moved successfully!");
  } catch (err) {
    console.error("Error processing PDFs:", err);
  }
};

// Execute
runAllPdfs();
