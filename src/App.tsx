import React, { useState } from "react";
import { ShieldCheck, Sparkles, Database, Layers, MessageSquare, Key, ShieldAlert } from "lucide-react";
import PasswordInputPanel from "./components/PasswordInputPanel";
import SuggesterPanel from "./components/SuggesterPanel";
import VaultManagerPanel from "./components/VaultManagerPanel";
import KAnonymityVisualizer from "./components/KAnonymityVisualizer";
import EduChatPanel from "./components/EduChatPanel";

type AppTab = "analyze" | "suggest" | "pwned" | "vault" | "chat";

export default function App() {
  const [password, setPassword] = useState("S3cur!ty_Ex_2026");
  const [activeTab, setActiveTab] = useState<AppTab>("analyze");

  // Allow custom suggested/alternative passwords to be synced into the central editor
  const handleLoadSyncedPassword = (newPass: string) => {
    setPassword(newPass);
    setActiveTab("analyze");
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 text-neutral-900 font-sans flex flex-col antialiased" id="applet-viewport">
      {/* Decorative clean ambient stripe */}
      <div className="h-1.5 w-full bg-gradient-to-r from-slate-900 via-indigo-650 to-indigo-600 shrink-0" />

      {/* Humble Elegant Header */}
      <header className="bg-white border-b border-gray-100 py-5 px-6 shrink-0" id="main-app-header">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-md shadow-gray-200 shrink-0">
              <ShieldCheck className="h-5.5 w-5.5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                Password Strength Analyzer
              </h1>
              <p className="text-[11px] text-gray-500 font-medium tracking-wide">
                Interactive cryptographic training playground supporting information entropy math, PBKDF2 salting, and k-anonymity protocol simulations.
              </p>
            </div>
          </div>

          {/* Quick Info bar */}
          <div className="flex items-center gap-2.5 text-xs text-gray-500 bg-gray-50 border border-gray-150 rounded-lg p-2 px-3 md:self-center font-medium font-sans self-start">
            <Key className="h-4 w-4 text-indigo-505 text-indigo-500 shrink-0" />
            <span>Active Password:</span>
            <span className="font-mono bg-white px-2 py-0.5 border border-gray-200 rounded text-[11.5px] font-bold text-gray-950 truncate max-w-[160px] select-all">
              {password || "N/A"}
            </span>
          </div>
        </div>
      </header>

      {/* Main Interactive content container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-8 flex flex-col md:flex-row gap-6">
        
        {/* Navigation Sidebar Panel (Desktop layout) / top rail (Mobile) */}
        <section className="w-full md:w-[260px] flex flex-col gap-2 shrink-0 select-none" id="app-navigation-section">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3 pb-1 hidden md:block">
            Dashboard Modules
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-1 gap-1.5" id="nav-tabs-grid">
            <button
              id="tab-btn-analyze"
              type="button"
              onClick={() => setActiveTab("analyze")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-left transition-all border cursor-pointer ${
                activeTab === "analyze"
                  ? "bg-slate-900 text-white border-transparent shadow-sm shadow-slate-900/10"
                  : "bg-white text-gray-700 border-gray-100 hover:border-gray-250 hover:bg-slate-50/50"
              }`}
            >
              <ShieldCheck className={`h-4.5 w-4.5 ${activeTab === "analyze" ? "text-cyan-400" : "text-slate-500"}`} />
              <span>Real-time Analyzer</span>
            </button>

            <button
              id="tab-btn-suggest"
              type="button"
              onClick={() => setActiveTab("suggest")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-left transition-all border cursor-pointer ${
                activeTab === "suggest"
                  ? "bg-slate-900 text-white border-transparent shadow-sm shadow-slate-900/10"
                  : "bg-white text-gray-700 border-gray-105 hover:border-gray-250 hover:bg-slate-50/50"
              }`}
            >
              <Sparkles className={`h-4.5 w-4.5 ${activeTab === "suggest" ? "text-indigo-400 animate-pulse" : "text-indigo-500"}`} />
              <span>AI Alternatives</span>
            </button>

            <button
              id="tab-btn-pwned"
              type="button"
              onClick={() => setActiveTab("pwned")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-left transition-all border cursor-pointer ${
                activeTab === "pwned"
                  ? "bg-slate-900 text-white border-transparent shadow-sm shadow-slate-900/10"
                  : "bg-white text-gray-700 border-gray-105 hover:border-gray-250 hover:bg-slate-50/50"
              }`}
            >
              <Layers className={`h-4.5 w-4.5 ${activeTab === "pwned" ? "text-amber-400" : "text-slate-500"}`} />
              <span>k-Anonymity Leak</span>
            </button>

            <button
              id="tab-btn-vault"
              type="button"
              onClick={() => setActiveTab("vault")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-left transition-all border cursor-pointer ${
                activeTab === "vault"
                  ? "bg-slate-900 text-white border-transparent shadow-sm shadow-slate-900/10"
                  : "bg-white text-gray-700 border-gray-105 hover:border-gray-250 hover:bg-slate-50/50"
              }`}
            >
              <Database className={`h-4.5 w-4.5 ${activeTab === "vault" ? "text-emerald-400" : "text-slate-500"}`} />
              <span>PBKDF2 Store Vault</span>
            </button>

            <button
              id="tab-btn-chat"
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold tracking-wide text-left transition-all border cursor-pointer col-span-2 sm:col-span-1 ${
                activeTab === "chat"
                  ? "bg-slate-900 text-white border-transparent shadow-sm shadow-slate-900/10"
                  : "bg-white text-gray-700 border-gray-105 hover:border-gray-250 hover:bg-slate-50/50"
              }`}
            >
              <MessageSquare className={`h-4.5 w-4.5 ${activeTab === "chat" ? "text-sky-400" : "text-slate-500"}`} />
              <span>Cryptography Chat</span>
            </button>
          </div>

          {/* Core concept review sidecard (Only visible on desktop screen configurations) */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-sm space-y-4 hidden md:block mt-2 select-text font-sans" id="concept-review-sidecard">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-indigo-400 shrink-0" />
              <b className="text-xs font-extrabold uppercase tracking-widest text-indigo-300">Entropy (S) Proof</b>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Entropy measures key-randomness in bits ($S$). Because $S = L \cdot \log_2(R)$, lengthening structural strings increases key strength exponentially, whereas mixing symbol types only broadens linear sets.
            </p>
            <div className="border-t border-indigo-900/60 pt-3">
              <span className="text-[9px] text-indigo-300 block font-bold uppercase tracking-widest">Recommended standard</span>
              <p className="text-[10px] text-slate-400 mt-1">Diceware passphrases of minimum 15+ characters withstand state GPU cracking matrices indefinitely.</p>
            </div>
          </div>
        </section>

        {/* Central Dashboard Dynamic Display */}
        <section className="flex-1 min-w-0" id="central-view-wrapper">
          {activeTab === "analyze" && (
            <PasswordInputPanel
              password={password}
              onChange={setPassword}
            />
          )}

          {activeTab === "suggest" && (
            <SuggesterPanel
              currentPassword={password}
              onSelectPassword={handleLoadSyncedPassword}
            />
          )}

          {activeTab === "pwned" && (
            <KAnonymityVisualizer />
          )}

          {activeTab === "vault" && (
            <VaultManagerPanel
              currentPassword={password}
            />
          )}

          {activeTab === "chat" && (
            <EduChatPanel />
          )}
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 px-6 shrink-0 mt-auto text-center text-xs text-gray-400 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2 font-sans">
          <span>Password Strength Analyzer • Educational Cryptographic Sandbox</span>
          <span className="text-[10px] text-gray-450 hover:text-gray-900 font-medium cursor-default">Designed with strict safety, PBKDF2 iterations &amp; k-Anonymity protocols</span>
        </div>
      </footer>
    </div>
  );
}
