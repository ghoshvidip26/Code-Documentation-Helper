import "dotenv/config";
import path from "path";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { geminiEmbeddings, geminiLLM } from "./geminiLLM";

const VECTOR_ROOT = path.join(process.cwd(), "faiss_store");

function normalizeFrameworkName(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")     // remove spaces
    .replace(/[\._-]+/g, "") // remove ., _, -
    .trim();
}


export async function search(
  question: string,
  framework: string,
  history: any[] = []
) {
  const fw = normalizeFrameworkName(framework);
  
  // Load the monolithic store from the parent directory
  const storePath = VECTOR_ROOT;

  console.log(`📂 Loading FAISS index from: ${storePath} for framework: ${fw}`);

  let results: any[] = [];
  try {
    const store = await FaissStore.load(storePath, geminiEmbeddings);
    console.log("✅ Store loaded successfully.");

    // Filter results by framework in metadata
    console.log(`🔎 Searching for: "${question}" with filter: { framework: "${fw}" }`);
    
    // Note: FaissStore filter argument in LangChain JS depends on the underlying implementation.
    // If using faiss-node, standard metadata filtering applies.
    results = await store.similaritySearch(question, 5, { framework: fw });
    console.log(`✅ Found ${results.length} results.`);
  } catch (err) {
    console.error("❌ Error in search function:", err);
    throw err;
  }

  if (!results.length) return "Not in docs.";

  const context = results
    .map((r) => r.pageContent)
    .join("\n\n");

  const historyText = history
    .slice(-6)
    .map((h: any) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
    .join("\n");

  const prompt = `
You are a strict documentation assistant for ${framework}.
Answer ONLY using the Documentation below.

If the answer is not present, reply exactly:
"Not in docs."

Conversation History:
${historyText}

Documentation:
${context}

User Question:
${question}
`;

  const res = await geminiLLM.invoke(prompt);

  return res.content;
}
