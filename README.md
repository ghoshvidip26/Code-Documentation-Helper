# 🔍 StackSearch — AI-Powered Developer Documentation Assistant

StackSearch is an AI-powered search assistant that lets developers query framework documentation using natural language. Ask anything about **AWS, Docker, FastAPI, React, MongoDB, Node.js, Redis, PostgreSQL, Tailwind CSS, TypeScript**, and more — StackSearch retrieves the most relevant docs using **vector search (FAISS + Gemini embeddings)** and replies **only from the official documentation**.

If the answer isn’t in the docs, StackSearch will strictly reply:

> **Not in docs.**

This project was built as a real-world demonstration of:
✅ AI-powered RAG (Retrieval-Augmented Generation)  
✅ FAISS similarity search  
✅ Gemini Embeddings + LLM  
✅ Multi-framework doc ingestion & indexing  
✅ React frontend with markdown & code highlighting  
✅ MongoDB chat history persistence  
✅ Google Authentication  

---

## ✨ Features

### 🧠 AI-Powered Documentation Search
- Ask natural-language questions about any supported tech stack
- Answers **strictly grounded in documentation**
- Prevents hallucinations using “Not in docs” fallback

### 📚 Multi-Framework Support
Supporting (and expandable):
AWS • Docker • Express.js • FastAPI • MongoDB • Next.js • NumPy • Pandas
PostgreSQL • Prisma • React • Redis • Tailwind • TypeScript
Node.js • GraphQL • Kubernetes • Go • Python • Django


### 🧩 Vector Search using FAISS
- Docs split into semantic chunks
- Embedded with `gemini-embedding-001`
- Stored in a **monolithic FAISS index**
- Filtered per-framework using normalized metadata

### 🔐 Google Login (Firebase Auth)
- Secure login gateway
- Only authenticated users can chat

### 💾 Persistent Chat History (MongoDB)
- Messages stored per-framework
- Conversations restored on reload

### 💬 Clean Chat UI
- Built with **React + Tailwind**
- Markdown rendering
- Syntax-highlighted code blocks
- One-click **copy button**
- Beautiful dark theme

---

## 🏗️ Tech Stack

### 🔹 Frontend
- React
- TypeScript
- Tailwind CSS
- React Markdown
- Syntax Highlighter
- Redux Toolkit
- Firebase Auth
- React Router

### 🔹 Backend
- Node.js
- Express
- TypeScript
- MongoDB + Mongoose
- LangChain
- Gemini LLM + Embeddings
- FAISS Vector Index

---

## 🚀 Getting Started

### 1️⃣ Clone the Repo
```sh
git clone https://github.com/yourusername/stacksearch.git
cd stacksearch
```

### 2️⃣ Install Dependencies (Backend)
```sh
cd server
npm install
```

### 3️⃣ Set up environment variables
```sh
cp .env.example .env
```

### 4️⃣ Ingest docs
```sh
npm run ingest
``` 

### 5️⃣ Run the app
```sh
npm run dev
```

### 6️⃣ Install Dependencies (Frontend)
```sh
cd client
npm install
```

### 7️⃣ Set up environment variables
```sh
cp .env.example .env
```

### 8️⃣ Run the app
```sh
npm run dev
```

## 🔑 Authentication Flow

- User logs in with Google via Firebase
- Redux stores user session
- Logged-in users can access chat
- Logout clears state + storage

## 🗄️ Chat History Storage

- Each framework maintains its own conversation thread.

### Schema: 
```sh
 chatId: string       // framework name
 framework: string
 history: [
  { role: "user" | "assistant", content: string, timestamp: Date }
]
```

## RAG Search Flow
- User asks question
- Query embedded via Gemini
- FAISS retrieves top-k relevant doc chunks
- Gemini LLM answers ONLY using those docs
- If missing → reply "Not in docs."
- Save messages to MongoDB
