import { NextResponse } from "next/server";
import { StreamingTextResponse, createStreamDataTransformer } from "ai";
import { DataAPIClient } from "@datastax/astra-db-ts";
import { OllamaEmbeddings } from "@langchain/ollama";
import { Ollama } from "ollama";
import { setGlobalDispatcher, Agent } from "undici";
import {LRUCache} from "lru-cache";

setGlobalDispatcher(new Agent({
  connect: { timeout: 60000 },  // 60s
  headersTimeout: 300000,        // wait longer for headers
  
}));

const {
  ASTRA_DB_NAMESPACE,
  ASTRA_DB_COLLECTION,
  ASTRA_DB_API_ENDPOINT,
  ASTRA_DB_APPLICATION_TOKEN,
  OLLAMA_API_ENDPOINT,
} = process.env;

// Astra DB client
const astraClient = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
const db = astraClient.db(ASTRA_DB_API_ENDPOINT!, {
  namespace: ASTRA_DB_NAMESPACE,
});

// LangChain embeddings (for RAG)
const embeddings = new OllamaEmbeddings({
  model: "mxbai-embed-large",
  baseUrl: OLLAMA_API_ENDPOINT || "http://localhost:11434",
});

// Ollama client
const ollamaClient = new Ollama({
  host: OLLAMA_API_ENDPOINT || "http://localhost:11434",
});

// LRU Cache
const cache = new LRUCache<string, string>({
  max: 100,           // store last 100 queries
  ttl: 1000 * 60 * 60 // 1 hour TTL
});


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    const latestMessage = messages[messages.length - 1]?.content ?? "";
    console.log(`Latest Message from Frontend - ${latestMessage}`);

    if (cache.has(latestMessage)) {
      console.log("⚡ Returning cached response");
      return NextResponse.json({ response: cache.get(latestMessage) });
    }

    // 1️⃣ Retrieve context from Astra DB
    let docContext = "No external context available.";
    if (latestMessage) {
      try {
        const queryEmbedding = await embeddings.embedQuery(latestMessage);

        const collection = await db.collection(ASTRA_DB_COLLECTION!);
        const cursor = await collection.find(null, {
          sort: { $vector: queryEmbedding },
          limit: 5,
        });
        const results = await cursor.toArray();

        if (results?.length) {
          docContext = results
            .map((doc: any) => doc.text ?? JSON.stringify(doc))
            .join("\n\n---\n\n");
          console.log("📄 Retrieved context:", docContext);
        }
      } catch (err) {
        console.warn("Astra DB vector search error:", err);
      }
    }

const systemPrompt = `You are a helpful assistant. Follow these rules strictly:

1. **Use Context First**  
   - Always prioritize the provided context when forming an answer.  
   - If context exists, never override it with your own knowledge.  
   - Cite the source if the context contains the answer.  

2. **If Context is Missing**  
   - If no relevant context is available, use your trained knowledge.  
   - BUT if there are multiple interpretations (e.g., cultural nicknames, disputed titles), present the most widely accepted answer AND note alternatives if applicable.  

3. **Factual Accuracy**  
   - Never invent facts.  
   - If uncertain, respond with:  
     "I don't know / can't confirm this — please verify with an authoritative source."  

4. **Answer Style**  
   - Be concise.  
   - Do not repeat the user’s question.  

5. **Special Rule for RPA Process Evaluation**  
   - If the user provides an RPA process or workflow, analyze it and respond with:  
     - **Rating**: Suitability for automation (Low / Medium / High) with a short justification.  
     - **ROI**: Expected Return on Investment (Low / Medium / High) and explain why.  
     - **Execution Constraints**: List technical, business, or compliance constraints.  
     - **To-Be Approach**: How the process should ideally be automated.  
     - **Pre-Requisites**: Dependencies, setup, or organizational requirements before automation.  

Context:  
${docContext}`;




    // 2️⃣ Enrich messages with context
    const enrichedMessages = [
      ...messages,
      {
        role: "system",
        content: systemPrompt,
      },
    ];
    console.log("📝 Enriched messages:", enrichedMessages.slice(-2));

    // 3️⃣ Call Ollama in streaming mode
    const responseAsyncIter = await ollamaClient.chat({
      model: "llama3:latest",
      messages: enrichedMessages,
      stream: true,
      options: {
        temperature: 0.2,       // lower = more factual/stable, higher = more creative
        top_p: 0.9,             // nucleus sampling (0.9 = good balance)
        top_k: 40,              // limits candidates per step
        repeat_penalty: 1.1,    // discourages repetition

      }
    });

    // 4️⃣ Convert async iterator → ReadableStream
    const encoder = new TextEncoder();
    const ollamaStream = new ReadableStream({
      async start(controller) {
        
        try {
          let prev = "";
          for await (const part of responseAsyncIter) {
            console.log("inside part of responseAsyncIter: "+JSON.stringify(part.message));
            
            const chunk = part?.message?.content ?? "";
            if (chunk) {
              console.log("✂️ Ollama chunk:", chunk);
              controller.enqueue(encoder.encode(chunk));
            }
          }
        } catch (err) {
          console.error("Streaming error:", err);
        } finally {
          controller.close();
        }
      },
    });

    // 5️⃣ Pipe through transformer so `useChat` understands format
    const stream = ollamaStream.pipeThrough(createStreamDataTransformer());
    console.log(stream);


    // 6️⃣ Return the streaming response
    return new StreamingTextResponse(stream);
  } catch (err: any) {
    console.error("Chat route failed:", err);
    return NextResponse.json(
      { error: "Failed to process chat" },
      { status: 500 }
    );
  }
}
