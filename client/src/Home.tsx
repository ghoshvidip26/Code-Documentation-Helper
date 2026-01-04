import { useEffect, useReducer, useState } from "react";
import { Send, Code, Copy } from "lucide-react";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

/* ---------------- TYPES ---------------- */

type Message = {
  role: "user" | "assistant";
  content: string;
};

type State = {
  framework: string | null;
  messages: Message[];
  loading: boolean;
};

type Action =
  | { type: "SET_FRAMEWORK"; payload: string | null }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_MESSAGES"; payload: Message[] };

/* ---------------- REDUCER ---------------- */

const initialState: State = {
  framework: null,
  messages: [],
  loading: false,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_FRAMEWORK":
      return { ...state, framework: action.payload };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.payload] };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_MESSAGES":
      return { ...state, messages: action.payload };
    default:
      return state;
  }
}

/* ---------------- STORAGE ---------------- */

const CHAT_KEY = "devstack-chat-id";

function getChatId() {
  let id = localStorage.getItem(CHAT_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CHAT_KEY, id);
  }
  return id;
}
/* ---------------- STACK LIST ---------------- */

const techStacks = [
  { name: "AWS", icon: "☁️" },
  { name: "Docker", icon: "🐳" },
  { name: "Express.js", icon: "🚀" },
  { name: "FastAPI", icon: "🐍" },
  { name: "MongoDB", icon: "🍃" },
  { name: "Next.js", icon: "⏭️" },
  { name: "NumPy", icon: "🔢" },
  { name: "Pandas", icon: "🐼" },
  { name: "PostgreSQL", icon: "🐘" },
  { name: "Prisma ORM", icon: "🔌" },
  { name: "React", icon: "⚛️" },
  { name: "Redis", icon: "🔴" },
  { name: "Tailwind CSS", icon: "🎨" },
  { name: "TypeScript", icon: "📝" },
  { name: "Node.js", icon: "🟢" },
  { name: "GraphQL", icon: "🕸️" },
  { name: "Kubernetes", icon: "☸️" },
  { name: "Go", icon: "🐹" },
  { name: "Python", icon: "🐍" },
  { name: "Django", icon: "🌿" }
];

/* ---------------- COMPONENT ---------------- */

export default function Home() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [input, setInput] = useState("");

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch(`http://localhost:3000/history`);
        const data = await res.json();
        const restoredMessages = data.flatMap((chat: any) => chat.history);
        dispatch({ type: "SET_MESSAGES", payload: restoredMessages });
      } catch (e) {
        console.warn("History failed to load", e);
      }
    }

    loadHistory();
  }, []);

  async function callBackend(question: string) {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const res = await fetch("http://localhost:3000/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: question,
          framework: state.framework,
          history: state.messages,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      const messageContent = data.answer;
      console.log(messageContent);

      dispatch({
        type: "ADD_MESSAGE",
        payload: { role: "assistant", content: messageContent ?? "No response" },
      });
    } catch {
      dispatch({
        type: "ADD_MESSAGE",
        payload: { role: "assistant", content: "⚠️ Backend error. Please try again." },
      });
    }

    dispatch({ type: "SET_LOADING", payload: false });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const question = input;
    setInput("");

    dispatch({
      type: "ADD_MESSAGE",
      payload: { role: "user", content: question },
    });

    await callBackend(question);
  };

  const featuredStacks = techStacks.slice(0, 6);

  return (
    <div className="flex flex-col h-screen bg-slate-950">

      {/* HEADER */}
      <header className="bg-slate-900 text-white border-b border-slate-800 px-8 py-3 flex items-center gap-3">
        <Code className="w-6 h-6 text-indigo-400" />
        <h1 className="text-xl font-semibold">DevStack AI</h1>
      </header>

      <main className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4 hidden md:block">
          {techStacks.map((t) => (
            <motion.button
              whileHover={{ x: 6 }}
              key={t.name}
              onClick={() => dispatch({ type: "SET_FRAMEWORK", payload: t.name })}
              className={`w-full text-slate-200 px-3 py-2 rounded-lg text-left mb-1 ${state.framework === t.name
                ? "bg-indigo-500"
                : "hover:bg-slate-800"
                }`}
            >
              {t.icon} {t.name}
            </motion.button>
          ))}
        </aside>

        {/* CHAT */}
        <section className="flex-1 flex flex-col">
          {state.messages.length === 0 && (
            <div className="flex flex-row justify-center items-center h-screen gap-6 mx-auto">
              {featuredStacks.map((tech) => (
                <motion.button
                  key={tech.name}
                  whileHover={{ x: 6 }}
                  onClick={() =>
                    dispatch({ type: "SET_FRAMEWORK", payload: tech.name })
                  }
                  className={`px-4 py-2.5 rounded-lg flex items-center gap-3 text-sm font-medium transition-colors text-slate-200
      ${state.framework === tech.name
                      ? "bg-indigo-500 text-white shadow-sm"
                      : "text-slate-100/80 hover:bg-slate-800/80"
                    }`}
                >
                  <span>{tech.icon}</span>
                  <span>{tech.name}</span>
                </motion.button>
              ))}
            </div>
          )}


          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {state.messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`px-5 py-4 text-slate-200 rounded-2xl max-w-3xl ${m.role === "user"
                    ? "bg-indigo-500"
                    : "bg-slate-800 border border-slate-700"
                    }`}
                >
                  <ReactMarkdown
                    components={{
                      code({ inline, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || "");
                        if (!inline && match) {
                          return (
                            <div className="relative group">
                              <button
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition"
                                onClick={() =>
                                  navigator.clipboard.writeText(String(children))
                                }
                              >
                                <Copy size={14} />
                              </button>

                              <SyntaxHighlighter
                                style={oneDark}
                                language={match[1]}
                              >
                                {String(children).replace(/\n$/, "")}
                              </SyntaxHighlighter>
                            </div>
                          );
                        }

                        return (
                          <code className="bg-slate-700 text-slate-200 px-1 rounded">
                            {children}
                          </code>
                        );
                      },
                    }}
                  >
                    {m.content}
                  </ReactMarkdown>
                </div>
              </div>
            ))}

            {state.loading && (
              <p className="text-center text-slate-400">Assistant is thinking…</p>
            )}
          </div>
          {/* INPUT */}
          <form onSubmit={handleSubmit} className="p-4 bg-slate-900 border-t border-slate-800">
            <div className="flex gap-3 max-w-4xl mx-auto">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Ask about ${state.framework || "any stack"}…`}
                className="flex-1 bg-slate-800 text-slate-200 border border-slate-700 px-4 py-3 rounded-xl"
              />
              <button className="bg-indigo-500 text-slate-200 px-4 rounded-xl">
                <Send />
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
