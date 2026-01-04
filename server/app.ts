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
  try {
    await dbConnect();

    const { query, framework } = req.body;
    if (!framework) return res.status(400).json({ error: "Framework required" });

    const chatId = framework.toLowerCase();

    // 🟢 find or create chat thread
    let chat = await Chat.findOne({ chatId });

    if (!chat) {
      chat = await Chat.create({
        chatId,
        framework,
        history: []
      });
    }

    // 🟢 push user message
    chat.history.push({
      role: "user",
      content: query
    });

    await chat.save();

    // call RAG
    const answer = await search(query, framework, chat.history);
    console.log(answer);

    // 🟢 push assistant reply
    chat.history.push({
      role: "assistant",
      content: answer
    });

    await chat.save();

    res.json({ answer });

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Search failed" });
  }
});

app.get("/history", async (req, res) => {
  try {
    await dbConnect();

    const history = await Chat.find().lean<IChat>();
    console.log(history);

    res.json(history);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

app.get("/history/:framework", async (req, res) => {
  try {
    await dbConnect();

    const chatId = req.params.framework.toLowerCase();
    console.log(chatId);

    const chat = await Chat.findOne({ chatId }).lean();
    console.log(chat);

    res.json(chat ?? []);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});


app.listen(3000, () => {
  console.log("Server started on port 3000");
});
