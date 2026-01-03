import "dotenv/config";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { geminiEmbeddings, geminiLLM } from "./geminiLLM";

const VECTOR_PATH = "faiss_store";

async function search(question: string, framework: string) {
  const store = await FaissStore.load(VECTOR_PATH, geminiEmbeddings);
  console.log("Store loaded!", store);
  const results = await store.similaritySearch(
    question,
    5,
    (doc: any) => doc.metadata.framework === framework // metadata filter
  );

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
  await search("how to use dependencies in fastapi?", "fastapi");
}

run();
