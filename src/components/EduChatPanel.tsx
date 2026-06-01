import React, { useState, useRef, useEffect } from "react";
import { Send, BookOpen, Bot, User, Trash2, ArrowUpRight, HelpCircle } from "lucide-react";
import { ChatMessage } from "../types";

const EDUCATION_SUGGESTIONS = [
  { text: "What is cryptographic Entropy ($H$)?", tag: "entropy" },
  { text: "Why is salting required for secure databases?", tag: "salting" },
  { text: "Argon2 vs standard fast SHA-256 hashing", tag: "slow hashing" },
  { text: "How does k-anonymity protect my leaks securely?", tag: "k-anonymity" }
];

export default function EduChatPanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "initial-mod",
      role: "assistant",
      content: `### Welcome to the Cryptographic Education Hub

I am your Cryptic Security AI. I can teach you about modern password safety math, encoding principles, and cryptographic attacks:
- **How Entropy works** (Type 'entropy')
- **The importance of Salting & Rainbow Tables** (Type 'salting')
- **Slow hashing algorithms vs fast hashes** (Type 'slow hashing')
- **How 'Have I Been Pwned' works via k-Anonymity** (Type 'k-anonymity')

Feel free to ask any cryptographic or password-safety questions below!`
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const messageContent = (textToSend || input).trim();
    if (!messageContent) return;

    if (!textToSend) {
      setInput("");
    }

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: messageContent,
    };

    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const res = await fetch("/api/crypto-education", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: data.reply
          }
        ]);
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Encountered a server connectivity failure. PBKDF2 parameters remain operational locally. Check connection to database."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: "initial-reset",
        role: "assistant",
        content: "Session cleared. What would you like to explore next about password architecture, salt arrays, or GPU cracking complexity?"
      }
    ]);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-[650px]" id="edu-chat-panel">
      <div className="flex justify-between items-start pb-4 border-b border-gray-100 shrink-0">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-505 text-indigo-600" />
            Cryptographic Classroom & Chat
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Learn mathematical entropy details, range querying anonymity, and password protection algorithms.
          </p>
        </div>
        <button
          id="btn-clear-chat-history"
          type="button"
          onClick={handleClearHistory}
          className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-205 rounded text-gray-550 hover:text-gray-900 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer transition-colors"
          title="Reset educational session"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Clear Log
        </button>
      </div>

      {/* Chat Messages Scrolling Content */}
      <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 scrollbar-thin" id="messages-container">
        {messages.map((message) => {
          const isModel = message.role === "assistant";
          return (
            <div
              key={message.id}
              className={`flex gap-3 max-w-[85%] ${
                isModel ? "self-start" : "self-end ml-auto flex-row-reverse"
              } animate-fadeIn`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  isModel ? "bg-indigo-100 text-indigo-605 text-indigo-600" : "bg-zinc-100 text-zinc-700"
                }`}
              >
                {isModel ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
              </div>

              <div
                className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  isModel
                    ? "bg-slate-50 text-gray-90s text-gray-900 border border-slate-120 border-slate-100"
                    : "bg-indigo-600 text-white rounded-tr-none"
                }`}
              >
                {/* Visual markdown bullet parser format rendering support */}
                <div className="space-y-2 select-text font-sans">
                  {message.content.split("\n\n").map((block, idx) => {
                    // Title check
                    if (block.startsWith("###")) {
                      return (
                        <h4 key={idx} className="font-bold text-gray-900 text-sm mt-2 mb-1">
                          {block.replace("###", "").trim()}
                        </h4>
                      );
                    }
                    if (block.startsWith("$$")) {
                      return (
                        <div key={idx} className="bg-slate-900 text-cyan-400 font-mono py-2.5 px-3 rounded-lg text-[11px] overflow-x-auto my-1 border border-slate-800">
                          {block.replace(/\$\$/g, "").trim()}
                        </div>
                      );
                    }
                    // Handle list items
                    if (block.startsWith("-")) {
                      return (
                        <ul key={idx} className="list-disc pl-4 space-y-1">
                          {block.split("\n").map((li, lIdx) => (
                            <li key={lIdx} className="text-gray-700 leading-normal">
                              {li.replace(/^- \s*/, "").replace(/\*\*/g, "")}
                            </li>
                          ))}
                        </ul>
                      );
                    }
                    return (
                      <p key={idx} className={isModel ? "text-gray-700" : "text-white"}>
                        {block}
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[80%] animate-pulse">
            <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
              <Bot className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="bg-slate-50 rounded-2xl px-4 py-3 border border-gray-100 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
              <span className="text-[10px] text-gray-400 font-medium ml-1">AI Cryptographer is compiling formulas...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Recommended Topics */}
      <div className="shrink-0 pt-2 border-t border-gray-100" id="topic-suggestions">
        <span className="text-[10px] uppercase font-extrabold tracking-widest text-gray-400 block mb-2 flex items-center gap-1">
          <HelpCircle className="h-3.5 w-3.5" /> Quick Inquiry Suggestions
        </span>
        <div className="grid grid-cols-2 gap-2">
          {EDUCATION_SUGGESTIONS.map((s, idx) => (
            <button
              id={`edu-suggestion-btn-${idx}`}
              key={idx}
              type="button"
              onClick={() => handleSend(s.tag)}
              className="text-[11px] font-sans font-medium text-left text-gray-600 hover:text-indigo-650 bg-slate-50 hover:bg-indigo-50/50 hover:border-indigo-100 border border-transparent rounded-lg p-2.5 transition-all truncate flex items-center justify-between cursor-pointer"
            >
              <span>{s.text}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-60 ml-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Input Group */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2 mt-4 pt-4 border-t border-gray-100 shrink-0"
        id="edu-chat-form"
      >
        <input
          id="edu-text-input"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about entropy equations, MD5 weaknesses, salts, etc..."
          className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-gray-900"
        />
        <button
          id="btn-send-message"
          type="submit"
          disabled={!input.trim() || isLoading}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white font-medium text-xs tracking-wider uppercase rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
        >
          <Send className="h-3.5 w-3.5" />
          Send
        </button>
      </form>
    </div>
  );
}
