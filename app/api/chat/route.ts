  import { NextResponse } from "next/server";
  import { StreamingTextResponse, createStreamDataTransformer } from "ai";
  import { DataAPIClient } from "@datastax/astra-db-ts";
  import { OllamaEmbeddings } from "@langchain/ollama";
  import { Ollama } from "ollama";
  import { setGlobalDispatcher, Agent } from "undici";
  import { LRUCache } from "lru-cache";

  setGlobalDispatcher(new Agent({
    connect: { timeout: 60000 },
    headersTimeout: 300000,
  }));

  const {
    ASTRA_DB_NAMESPACE,
    ASTRA_DB_COLLECTION,
    ASTRA_DB_API_ENDPOINT,
    ASTRA_DB_APPLICATION_TOKEN,
    OLLAMA_API_ENDPOINT,
  } = process.env;

  const astraClient = new DataAPIClient(ASTRA_DB_APPLICATION_TOKEN!);
  const db = astraClient.db(ASTRA_DB_API_ENDPOINT!, { namespace: ASTRA_DB_NAMESPACE });

  const embeddings = new OllamaEmbeddings({
    model: "mxbai-embed-large",
    baseUrl: OLLAMA_API_ENDPOINT || "http://localhost:11434",
  });

  const ollamaClient = new Ollama({
    host: OLLAMA_API_ENDPOINT || "http://localhost:11434",
  });

  // LRU Cache
  const cache = new LRUCache<string, string>({
    max: 100,
    ttl: 1000 * 60 * 60, // 1 hour
  });

  export async function POST(req: Request) {
    try {
      const body = await req.json();
      const messages = body.messages ?? [];
      const latestMessage = messages[messages.length - 1]?.content?.trim() ?? "";
      console.log(`Message from the Frontend :${latestMessage}`);
      

      if (!latestMessage) return NextResponse.json({ error: "No message" }, { status: 400 });

      // Check cache
      if (cache.has(latestMessage)) {
        console.log("⚡ Returning cached response");
        return NextResponse.json({ response: cache.get(latestMessage) });
      }

      const encoder = new TextEncoder();

      // 1️⃣ Stage 1: Quick model-only response
      const stage1Iter = await ollamaClient.chat({
        model: "llama3:latest",
        messages,
        stream: true,
        options: { temperature: 0.3, top_p: 0.9, top_k: 40 },
      });

      let stage1Response = "";

      // 2️⃣ Stage 2: Model + Context
      const stage2Async = async (controller: ReadableStreamDefaultController) => {
        try {
          let docContext = "No external context available.";
          try {
            const queryEmbedding = await embeddings.embedQuery(latestMessage);
            const collection = await db.collection(ASTRA_DB_COLLECTION!);
            const cursor = await collection.find(null, { sort: { $vector: queryEmbedding }, limit: 4 });
            const results = await cursor.toArray();
            if (results?.length) {
              docContext = results.map((doc: any) => doc.text ?? JSON.stringify(doc)).join("\n\n---\n\n");
              console.log("📄 Retrieved context for Stage 2:", docContext);
            }
          } catch (err) {
            console.warn("Astra DB error during Stage 2:", err);
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

          const enrichedMessages = [...messages, { role: "system", content: systemPrompt }];

          const stage2Iter = await ollamaClient.chat({
            model: "llama3:latest",
            messages: enrichedMessages,
            stream: true,
            options: { temperature: 0.2, top_p: 0.9, top_k: 40 },
          });

          let stage2Response = "";

          // ➡️ Stage 2 Header
          controller.enqueue(encoder.encode(`\n\n---\n#### 📚 Model + Context Answer\n---\n\n`));

          for await (const part of stage2Iter) {
            const chunk = part?.message?.content ?? "";
            if (chunk) {
              stage2Response += chunk;
              console.log("🟢 Stage 2 Chunk:", chunk);
              controller.enqueue(encoder.encode(chunk));
            }
          }

          cache.set(latestMessage, stage2Response);
          console.log("✅ Cached Stage 2 Response");
        } catch (err) {
          console.error("Stage 2 streaming error:", err);
        } finally {
          controller.enqueue(encoder.encode(`\n\n ✅ End of Response \n\n`));
          controller.close();
        }
      };

      // Combined stream: Stage 1 first, then Stage 2
      const combinedStream = new ReadableStream({
        async start(controller) {
          try {
            // ➡️ Stage 1 Header
            controller.enqueue(encoder.encode(`\n\n---\n#### 📌 Model-only Answer\n---\n\n`));

            for await (const part of stage1Iter) {
              const chunk = part?.message?.content ?? "";
              if (chunk) {
                stage1Response += chunk;
                console.log("🟢 Stage 1 Chunk:", chunk);
                controller.enqueue(encoder.encode(chunk));
              }
            }

            // Stage 2 streaming
            await stage2Async(controller);
          } catch (err) {
            console.error("Combined stream error:", err);
            controller.close();
          }
        },
      });

      const stream = combinedStream.pipeThrough(createStreamDataTransformer());
      return new StreamingTextResponse(stream);

    } catch (err: any) {
      console.error("Chat route failed:", err);
      return NextResponse.json({ error: "Failed to process chat" }, { status: 500 });
    }
  }
