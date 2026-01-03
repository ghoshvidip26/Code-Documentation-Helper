import "dotenv/config";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { geminiEmbeddings, geminiLLM } from "./geminiLLM";

import path from "path";
const VECTOR_PATH = path.join(__dirname, "..", "faiss_store");

async function search(question: string, framework: string) {
  console.log(`Loading FAISS store from: ${VECTOR_PATH}`);
  const store = await FaissStore.load(VECTOR_PATH, geminiEmbeddings);

  // First, let's verify the framework filter works
  const allDocs = await store.similaritySearch(question, 10);
  console.log(`Found ${allDocs.length} total documents`);

  // Filter by framework
  const frameworkDocs = allDocs.filter(
    (doc) => doc.metadata.framework.toLowerCase() === framework.toLowerCase()
  );

  console.log(
    `Found ${frameworkDocs.length} documents for framework: ${framework}`
  );

  // Take top 5 from filtered results
  const results = frameworkDocs.slice(0, 5);

  console.log("\nRetrieved Docs:\n");
  console.log(
    results.map((r: any) => ({
      framework: r.metadata.framework,
      file: r.metadata.filename,
      preview: r.pageContent.slice(0, 120),
    }))
  );

  const context = results.map((r: any) => r.pageContent).join("\n\n");

  const prompt = `
Answer the question using ONLY the documentation below.

Documentation:
${context}

Question: ${question}

If the answer is not in docs, reply: "Not in docs."
`;

  const res = await geminiLLM.invoke(prompt);

  console.log("\nAnswer:\n");
  console.log(res.content);
}

async function run() {
  const question = "how to use dependencies in fastapi?";
  const framework = "fastapi";
  console.log(`Searching for: "${question}" in framework: ${framework}`);
  await search(question, framework);
}

run().catch(console.error);
