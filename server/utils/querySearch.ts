import "dotenv/config";
import path from "path";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { geminiEmbeddings, geminiLLM } from "./geminiLLM";
import { normalizeFrameworkAlias } from "./normalizeFramework";

const VECTOR_ROOT = path.join(process.cwd(), "faiss_store");

export async function search(question: string, framework: string, history: any[] = []) {
  const fw = normalizeFrameworkAlias(framework);

  console.log(`🔎 Framework normalized → ${fw}`);

  const store = await FaissStore.load(VECTOR_ROOT, geminiEmbeddings);

  // --- Try metadata-filtered FAISS search ---
  let results = await store.similaritySearch(question, 8, { framework: fw });

  // --- Fallback: wide search → in-memory filter ---
  if (!results.length) {
    console.log("⚠️ Filter returned 0 — doing wide search and filtering…");
    const wide = await store.similaritySearch(question, 200);
    results = wide.filter(
      d => normalizeFrameworkAlias(d.metadata?.framework || "") === fw
    ).slice(0, 8);
  }

  if (!results.length) return "Not in docs.";

  const context = results.map(r => r.pageContent).join("\n\n");

  const historyText = history
    .slice(-6)
    .map(h => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
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
