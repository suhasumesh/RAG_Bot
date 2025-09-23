// route.ts (full file) - replace your existing file with this (keeps your original system prompt)
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
  ASTRA_DB_COLLECTION_RPA,
  ASTRA_DB_COLLECTION_AUGMENT,
  ASTRA_DB_COLLECTION_AIML,
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

// Helper: parse metadata block from message text
function parseMetadataFromText(text: string) {
  const meta = {
    domain: null as string | null,
    implementationGoal: null as string | null,
    structured: null as any | null,
    cleanedText: text,
  };

  const match = text.match(/<<METADATA>>([\s\S]*?)<<END METADATA>>/i);
  if (!match) return meta;

  const raw = match[1];

  const domainMatch = raw.match(/Domain:\s*(.+)/i);
  const goalMatch = raw.match(/ImplementationGoal:\s*(.+)/i);
  const structuredMatch = raw.match(/STRUCTURED:\s*({[\s\S]*?})/i); // <-- fixed

  if (domainMatch) meta.domain = domainMatch[1].trim();
  if (goalMatch) meta.implementationGoal = goalMatch[1].trim();
  if (structuredMatch) {
    try {
      meta.structured = JSON.parse(structuredMatch[1].trim());
    } catch (e) {
      console.error("JSON parse error:", e);
      meta.structured = null;
    }
  }

  meta.cleanedText = text.replace(match[0], "").trim();

  return meta;
}


// Deterministic scoring (use structured fields when present, otherwise heuristics)
function computeFactorScores(structured: any, rawText: string) {
  // Defaults
  const s = structured || {};
  // heuristic helpers:
  const contains = (words: string[]) => words.some(w => rawText.toLowerCase().includes(w));

  const pct_unstructured = s.pctUnstructured ?? (contains(["pdf", "image", "scan", "ocr", "email", "attachment", "invoice"]) ? 0.8 : 0.1);
  const exception_rate = s.exceptionRate ?? 0.05;
  const decision_points = s.decisionPoints ?? 0;
  const systemsArr = s.systems ?? [];
  const volume = s.volumePerDay ?? 0;
  const compliance = s.complianceSensitivity ?? 0.0;

  const decision_intensity = Math.min(1, decision_points / 5); // 5+ decisions => high
  const unstructured_content = Math.min(1, pct_unstructured);
  const orchestration_need = Math.min(1, (systemsArr.length || (contains(["sap","orchestrator","api","database","crm","erp"]) ? 3 : 1)) / 4);
  const variability = Math.min(1, exception_rate * 3); // scale
  const explainability_required = compliance >= 0.7 ? 1 : (contains(["audit","explain","why","audit trail"]) ? 0.8 : 0.3);
  const compliance_sensitive = Math.min(1, compliance);
  const volume_frequency = Math.min(1, volume / 1000); // 1000/day -> 1.0

  return {
    decision_intensity: Number(decision_intensity.toFixed(3)),
    unstructured_content: Number(unstructured_content.toFixed(3)),
    context_awareness: 0.5, // could be refined by more heuristics
    variability: Number(variability.toFixed(3)),
    exception_rate: Number(exception_rate.toFixed(3)),
    orchestration_need: Number(orchestration_need.toFixed(3)),
    explainability_required: Number(explainability_required.toFixed(3)),
    compliance_sensitive: Number(compliance_sensitive.toFixed(3)),
    volume_frequency: Number(volume_frequency.toFixed(3)),
  };
}

function decideDisposition(scores: any) {
  const d = scores;
  // deterministic rules (tweak thresholds as you gather data)
  if (d.decision_intensity >= 0.7 && d.orchestration_need >= 0.6) return "Agentic AI";
  if (d.unstructured_content >= 0.6 && d.decision_intensity < 0.5) return "Augmented AI";
  if (d.exception_rate <= 0.1 && d.orchestration_need <= 0.3 && d.volume_frequency >= 0.5) return "RPA";
  if (d.explainability_required >= 0.7 || d.compliance_sensitive >= 0.7) return "Process Transformation / Data Governance Required";
  return "Single Agent Fit / Augmented AI Fit";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const messages = body.messages ?? [];
    let latestMessage = messages[messages.length - 1]?.content?.trim() ?? "";
    console.log(`Message from the Frontend :${latestMessage}`);

    if (!latestMessage) return NextResponse.json({ error: "No message" }, { status: 400 });

    // parse metadata block if present
    const meta = parseMetadataFromText(latestMessage);
    console.log(`Meta data from the Frontend - ${JSON.stringify(meta)}`);
  
    const domain = meta.domain ?? null;
    console.log(`Domain data from the Frontend - ${domain}`);
    const implementationGoal = meta.implementationGoal ?? null;
    console.log(`Implementational Goal from the Frontend - ${implementationGoal}`);
    const structured = meta.structured ?? null;
    console.log(`Structured Meta data - ${JSON.stringify(structured)}`);

    // replace latest message content with cleaned text (remove metadata block)
    if (meta.cleanedText !== latestMessage) {
      messages[messages.length - 1].content = meta.cleanedText;
      latestMessage = meta.cleanedText;
    }

    // Check cache (based on cleaned latest message + domain)
    const cacheKey = `${domain ?? "default"}::${latestMessage}`;
    if (cache.has(cacheKey)) {
      console.log("⚡ Returning cached response");
      return NextResponse.json({ response: cache.get(cacheKey) });
    }

    const encoder = new TextEncoder();

    // Stage1: model-only (fast)
    const stage1Iter = await ollamaClient.chat({
      model: "llama3:latest",
      messages,
      stream: true,
      options: { temperature: 0.3, top_p: 0.9, top_k: 40 },
    });

    let stage1Response = "";

    // Stage2: Model + Context (RAG) - we will select collection based on domain
    const stage2Async = async (controller: ReadableStreamDefaultController) => {
      try {
        // choose collection based on domain (allow environment overrides)
        const domainToCollection: Record<string, string | undefined> = {
          "RPA": ASTRA_DB_COLLECTION_RPA,
          "Augment AI": ASTRA_DB_COLLECTION_AUGMENT,
          "AI/ML": ASTRA_DB_COLLECTION_AIML,
        };

        const targetCollectionName = (domain && domainToCollection[domain]) ? domainToCollection[domain] : ASTRA_DB_COLLECTION;
        const collectionNameToUse = targetCollectionName || ASTRA_DB_COLLECTION!;

        let docContext = "No external context available.";
        try {
          // compute embedding then search the (domain-specific) collection
          const queryEmbedding = await embeddings.embedQuery(latestMessage);
          const collection = await db.collection(collectionNameToUse!);
          const cursor = await collection.find(null, { sort: { $vector: queryEmbedding }, limit: 4 });
          const results = await cursor.toArray();
          if (results?.length) {
            docContext = results.map((doc: any) => doc.text ?? JSON.stringify(doc)).join("\n\n---\n\n");
            console.log("📄 Retrieved context for Stage 2 from", collectionNameToUse, ":", docContext ? "[ok]" : "[empty]");
          }
        } catch (err) {
          console.warn("Astra DB error during Stage 2:", err);
        }

        // compute factor scores (deterministic)
        const factorScores = computeFactorScores(structured, latestMessage);
        const preliminaryDisposition = decideDisposition(factorScores);

        // Append pre-evaluation summary to the docContext so Llama sees it
        const preEval = {
          metadataProvided: { domain, implementationGoal, structuredProvided: structured !== null },
          preliminaryDisposition,
          factorScores,
          note: "This pre-evaluation was computed deterministically by the evaluation engine prior to RAG. Use these as baseline guidance."
        };

        // Append the pre-eval to docContext (keeps your systemPrompt unchanged)
        docContext = `${docContext}\n\n---\n[Pre-Evaluation]\n${JSON.stringify(preEval, null, 2)}\n---\n\n`;

        // system prompt (leave your rules intact)
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

        // Stage 2 Header
        controller.enqueue(encoder.encode(`\n\n---\n#### 📚 Model + Context Answer\n---\n\n`));

        for await (const part of stage2Iter) {
          const chunk = part?.message?.content ?? "";
          if (chunk) {
            stage2Response += chunk;
            console.log("🟢 Stage 2 Chunk:", chunk);
            controller.enqueue(encoder.encode(chunk));
          }
        }

        // Cache Stage2 response keyed by domain + text
        cache.set(cacheKey, stage2Response);
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
          // Stage 1 Header
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

  //---Generating the Suggestions to User to ask further questions
  
}
