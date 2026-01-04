import "dotenv/config";
import fs from "fs";
import path from "path";
import { Document } from "langchain";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { geminiEmbeddings } from "./utils/geminiLLM";
import express from "express";
import cors from "cors";
import { search } from "./utils/querySearch";
import { dbConnect } from "./utils/mongodb";
import Chat, { IChat } from "./db/schema";

const app = express();
app.use(cors());
app.use(express.json());

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

app.post("/search", async (req, res) => {
  const { query, chatId, framework } = req.body;

  await dbConnect();

  let chat = await Chat.findOne({ chatId }).lean<IChat>();

  const history = chat?.history ?? [];

  const answer = await search(query, framework, history);

  await Chat.updateOne(
    { chatId },
    {
      $push: {
        history: [
          { role: "user", content: query },
          { role: "assistant", content: answer }
        ]
      }
    },
    { upsert: true }
  );

  res.json({ answer });
});

app.listen(3000, () => {
  console.log("Server started on port 3000");
});
