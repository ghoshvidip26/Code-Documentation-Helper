import "dotenv/config";
import fs from "fs";
import path from "path";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { geminiEmbeddings } from "./geminiLLM";

const DATASET_DIR = path.join(__dirname, "..", "docs_dataset");
const VECTOR_PATH = path.join(__dirname, "..", "faiss_store");

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
});

function clean(text: string) {
  return text.replace(/\u0000/g, "").trim();
}

async function loadFramework(name: string) {
  const dir = path.join(DATASET_DIR, name);
  const files = fs.readdirSync(dir);
  let docs: Document[] = [];

  for (const f of files) {
    const raw = fs.readFileSync(path.join(dir, f), "utf8");
    const cleaned = clean(raw);

    if (cleaned.length < 25) continue;

    docs.push(
      new Document({
        pageContent: cleaned,
        metadata: { framework: name, file: f },
      })
    );
  }

  return splitter.splitDocuments(docs);
}

async function main() {
  const frameworks = fs.readdirSync(DATASET_DIR);

  let allChunks: Document[] = [];

  for (const fw of frameworks) {
    const chunks = await loadFramework(fw);
    console.log(`✔ ${fw} → ${chunks.length} chunks`);
    allChunks.push(...chunks);
  }

  console.log(`\n🧠 Total chunks: ${allChunks.length}`);

  // ---- CRASH-SAFE BATCH EMBEDDING ----
  const BATCH = 50;
  const vectors: any[] = [];
  const metas: any[] = [];

  for (let i = 0; i < allChunks.length; i += BATCH) {
    const slice = allChunks.slice(i, i + BATCH);

    const embeddings = await geminiEmbeddings.embedDocuments(
      slice.map((d) => d.pageContent)
    );

    vectors.push(...embeddings);
    metas.push(...slice);

    console.log(`Embedded ${i + slice.length}/${allChunks.length}`);
    await new Promise((r) => setTimeout(r, 150)); // small safety delay
  }

  const store = new FaissStore(geminiEmbeddings, {});
  await store.addVectors(vectors, metas);

  await store.save(VECTOR_PATH);

  console.log(`\n🎉 Saved FAISS to: ${VECTOR_PATH}\n`);
}

main();
