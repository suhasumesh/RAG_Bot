import { DataAPIClient } from "@datastax/astra-db-ts";
import { PuppeteerWebBaseLoader } from "@langchain/community/document_loaders/web/puppeteer";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { OllamaEmbeddings } from "@langchain/ollama";
import "dotenv/config";

type SimililarityMetric = "dot_product" | "cosine" | "euclidean";
process.env.OLLAMA_REQUEST_TIMEOUT = "300000";
const { OLLAMA_REQUEST_TIMEOUT, ASTRA_DB_NAMESPACE, ASTRA_DB_COLLECTION, ASTRA_DB_API_ENDPOINT, ASTRA_DB_APPLICATION_TOKEN, OLLAMA_API_ENDPOINT } = process.env;


const dataUrls = [
    
 "https://www.britannica.com/sports/cricket-sport/Technical-development",

  //--------------------------------------------------------------
"https://docs.uipath.com/studio/standalone/2024.10/user-guide/introduction",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/introduction",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/installation",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/installation",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/first-steps",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/first-steps",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/user-interface",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/user-interface",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/variables-and-arguments",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/variables-and-arguments",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/control-flow",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/control-flow",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/exceptions",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/exceptions",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/debugging",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/debugging",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/publish-process",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/publish-process",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/activities-overview",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/activities-overview",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/data-tables",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/data-tables",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/recording-overview",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/recording-overview",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/selectors",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/selectors",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/references-and-packages",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/references-and-packages",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/advanced-debugging",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/advanced-debugging",
  "https://docs.uipath.com/studio/standalone/2024.10/user-guide/automation-templates",
  "https://docs.uipath.com/studio/standalone/2023.4/user-guide/automation-templates",
  "https://docs.uipath.com/activities/docs/about-activities",
  "https://docs.uipath.com/activities/docs/application-automation",
  "https://docs.uipath.com/activities/docs/data-manipulation",
  "https://docs.uipath.com/activities/docs/email-automation",
  "https://docs.uipath.com/activities/docs/excel-automation",
  "https://docs.uipath.com/activities/docs/file-automation",
  "https://docs.uipath.com/activities/docs/image-automation",
  "https://docs.uipath.com/activities/docs/internet-automation",
  "https://docs.uipath.com/activities/docs/ocr-automation",
  "https://docs.uipath.com/activities/docs/office-automation",
  "https://docs.uipath.com/activities/docs/robot-automation",
  "https://docs.uipath.com/activities/docs/system-automation",
  "https://docs.uipath.com/activities/docs/web-automation",
  "https://docs.uipath.com/activities/docs/workflow-automation",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/introduction",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/introduction",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/installation",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/installation",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/orchestrator-architecture",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/orchestrator-architecture",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/robots",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/robots",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/queues",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/queues",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/transactions",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/transactions",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/assets",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/assets",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/schedules",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/schedules",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/alerts",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/alerts",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/logs",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/logs",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/roles",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/roles",
  "https://docs.uipath.com/orchestrator/standalone/2024.10/user-guide/permissions",
  "https://docs.uipath.com/orchestrator/standalone/2023.4/user-guide/permissions",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/about-document-understanding",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/activities",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/annotate-tables-and-group-rows",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/annotations",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/auto-classify",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/auto-extract",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/auto-validate",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/classify-documents",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/ocr",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/retrain-extractors",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/train-a-classifier",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/troubleshooting",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/moving-projects",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/annotations",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/checkboxes-and-signatures",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/auto-classify",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/auto-extract",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/auto-validate",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/classify-documents",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/ocr",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/retrain-extractors",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/train-a-classifier",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/troubleshooting",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/moving-projects",
  "https://docs.uipath.com/document-understanding/automation-cloud/latest/user-guide/annotations",



  //---------------------------------------------------------------

   ];

const client = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN);
const db = client.db(ASTRA_DB_API_ENDPOINT, { namespace: ASTRA_DB_NAMESPACE });

const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 512, chunkOverlap: 100 });

const createCollection = async (simililarityMetric: SimililarityMetric = "dot_product") => {
    const collections = await db.listCollections();
    const collec = await db.collection(ASTRA_DB_COLLECTION);
    const docsCount = await collec.countDocuments;
    console.log(`The docsCount is : ${docsCount}`);

    const exists = collections.find((c) => c.name === ASTRA_DB_COLLECTION);
    if (!exists) {
        const res = await db.createCollection(ASTRA_DB_COLLECTION, {
            vector: {
                dimension: 1024,
                metric: simililarityMetric
            }
        });
        console.log(res);
    } else {
        console.log(`Collection '${ASTRA_DB_COLLECTION}' already exists, deleting creation.`);
        if (exists) {
            try {
                await db.dropCollection(ASTRA_DB_COLLECTION);
                console.log(`Dropped existing collection: ${ASTRA_DB_COLLECTION}`);
            } catch (e) {
                console.log("No existing collection to drop.");
            }
            console.log("Creating a Collection " + ASTRA_DB_COLLECTION);
            const res = await db.createCollection(ASTRA_DB_COLLECTION, {
                vector: {
                    dimension: 1024,
                    metric: simililarityMetric
                }
            });
            console.log(res);
        } else {
            console.log("The Collection is not present");
            console.log("Creating a Collection " + ASTRA_DB_COLLECTION);
            const res = await db.createCollection(ASTRA_DB_COLLECTION, {
                vector: {
                    dimension: 1024,
                    metric: simililarityMetric
                }
            });
            console.log(res);
        }

    }
}

const embedding = new OllamaEmbeddings({
    model: "mxbai-embed-large", // Default value
    baseUrl: "http://localhost:11434", // Default value

});

const loadSampleData = async () => {
    const collection = await db.collection(ASTRA_DB_COLLECTION);
    for await (const url of dataUrls) {
        const content = await scrapePage(url);
        const chunks: string[] = await splitter.splitText(content);
        for (let i = 0; i < chunks.length; i += 10) {
            const batch = chunks.slice(i, i + 10);
            const vectors = await embedding.embedDocuments(batch);

            const docs = batch.map((text, idx) => ({
                text,
                $vector: vectors[idx],
                source: url,
            }));
            const res = await collection.insertMany(docs); // 🚀 faster than insertOne loop
            console.log(`Inserted batch ${i / 10 + 1} from ${url}`);
            console.log(`${res}`);
        }
        //     const vectors = await embedding.embedDocuments(chunks);
        //    for (let i = 0; i < chunks.length; i++) {
        //         const res = await collection.insertOne({
        //         text: chunks[i],
        //         embedding: vectors[i], // already float[]
        //         source: url,
        //         });
        //         console.log(res);
        //     }
    }
}

const scrapePage = async (url: string) => {
    const loader = new PuppeteerWebBaseLoader(url, {
        launchOptions: {
            headless: true
        },
        gotoOptions: {
            waitUntil: "domcontentloaded"
        },
        evaluate: async (page, browser) => {
            const result = await page.evaluate(() => document.body.innerHTML)
            await browser.close()
            return result;
        }
    }
    )
    return (await loader.scrape())?.replace(/<[^>]*>?/gm, '')
}


loadSampleData()
  .then(() => console.log("Completed"))
  .catch((err) => console.error("Error loading sample data:", err));
