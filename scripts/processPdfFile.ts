import fs from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import { DataAPIClient } from "@datastax/astra-db-ts";
import "dotenv/config";
import path from "path";


const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
} = process.env;

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = client.db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 512,
    chunkOverlap: 100,
});

const embedding = new OllamaEmbeddings({
    model: "mxbai-embed-large",
    baseUrl: "http://localhost:11434",
});

/**
 * Process a PDF file → chunk → embed → insert into Astra DB
 */
export const processPdfFile = async (filePath: string) => {
    try {
        // 1) Load PDF content
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const loader = new PDFLoader(filePath, { splitPages: false });
        const docs = await loader.load();

        // 2) Extract raw text
        const textContent = docs.map((d) => d.pageContent).join("\n");

        // 3) Split into chunks
        const chunks: string[] = await splitter.splitText(textContent);

        // 4) Embed & insert in batches
        const collection = await db.collection(ASTRA_DB_COLLECTION!);
        for (let i = 0; i < chunks.length; i += 10) {
            const batch = chunks.slice(i, i + 10);
            const vectors = await embedding.embedDocuments(batch);

            const docsToInsert = batch.map((text, idx) => ({
                text,
                $vector: vectors[idx],
                source: filePath, // keep reference of source PDF
            }));

            const res = await collection.insertMany(docsToInsert);
            console.log(`Inserted batch ${i / 10 + 1} (${batch.length} docs) from ${filePath}`);
            console.log(res);
        }

        console.log(`Finished processing PDF: ${filePath}`);
    } catch (err) {
        console.error("Error processing PDF:", err);
    }
};

// const run = async () => {
//   try {
//     await processPdfFile("C:/Users/Dell/Downloads/1134259/ICITCC201706.pdf");
//   } catch (err) {
//     console.error("Failed to run:", err);
//   }
// }

// run();

