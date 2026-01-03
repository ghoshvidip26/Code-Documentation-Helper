import "dotenv/config";
import fs from "fs";
import path from "path";
import { Document } from "langchain";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { geminiEmbeddings } from "./utils/geminiLLM";

const ROOT = "docs_dataset";

async function loadDocs() {
  const docs: Document[] = [];

  for (const dir of fs.readdirSync(ROOT)) {
    const subDir = path.join(ROOT, dir);
    if (!fs.statSync(subDir).isDirectory()) continue;

    for (const file of fs.readdirSync(subDir)) {
      const filePath = path.join(subDir, file);
      if (!fs.statSync(filePath).isFile()) continue;

      const text = fs.readFileSync(filePath, "utf8");

      docs.push(
        new Document({
          pageContent: text,
          metadata: {
            framework: dir,
            filename: file,
            source: filePath,
          },
        })
      );
    }
  }

  return docs;
}

async function run() {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
  });

  console.log("Loading docs...");
  const docs = await loadDocs();
  console.log("Docs loaded:", docs.length);

  console.log("Splitting...");
  const chunks = await splitter.splitDocuments(docs);
  console.log("Chunks created:", chunks.length);

  console.log("Creating FAISS store...");

  try {
    const store = await FaissStore.fromDocuments(chunks, geminiEmbeddings);
    console.log("Store created!");

    await store.save("faiss_store");
    console.log("FAISS store saved 🚀");
  } catch (error) {
    console.error("Error details:", error);
    throw error; // This will show the actual error
  }
}

run().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
