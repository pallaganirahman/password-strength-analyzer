import React, { useState } from "react";
import { Sparkles, RefreshCw, Key, Shield, HelpCircle, AlertCircle } from "lucide-react";
import { SuggestedAlternative } from "../types";

interface SuggesterPanelProps {
  currentPassword: string;
  onSelectPassword: (pass: string) => void;
}

export default function SuggesterPanel({ currentPassword, onSelectPassword }: SuggesterPanelProps) {
  const [minLength, setMinLength] = useState(16);
  const [includeSpecial, setIncludeSpecial] = useState(true);
  const [includeNumbers, setIncludeNumbers] = useState(true);
  const [suggestions, setSuggestions] = useState<SuggestedAlternative[]>([]);
  const [evaluation, setEvaluation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSandbox, setIsSandbox] = useState(false);

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/suggest-passwords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          constraints: {
            minLength,
            includeSpecial,
            includeNumbers,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuggestions(data.suggestions || data.suggested || []);
        setEvaluation(data.evaluation || "");
        setIsSandbox(data.isSandbox || false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6 select-none" id="suggester-panel">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
          AI Cryptographic Suggestions
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Generate bulletproof, easy-to-remember password alternatives leveraging mnemonic formulas and high-entropy structures.
        </p>
      </div>

      {/* Constraints configuration */}
      <div className="bg-gray-55/60 rounded-xl border border-gray-100 p-4 space-y-4">
        <span className="text-xs font-bold text-gray-550 uppercase tracking-widest block">
          Tuning Parameters
        </span>
        
        <div className="space-y-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-semibold text-gray-700">
              <span>Minimum Characters</span>
              <span>{minLength} chars</span>
            </div>
            <input
              id="slider-min-length"
              type="range"
              min="10"
              max="32"
              value={minLength}
              onChange={(e) => setMinLength(parseInt(e.target.value))}
              className="w-full accent-indigo-650 cursor-pointer"
            />
          </div>

          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-gray-750 cursor-pointer select-none">
              <input
                id="checkbox-include-special"
                type="checkbox"
                checked={includeSpecial}
                onChange={(e) => setIncludeSpecial(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
              />
              Include Cryptic Symbols
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-gray-750 cursor-pointer select-none">
              <input
                id="checkbox-include-numbers"
                type="checkbox"
                checked={includeNumbers}
                onChange={(e) => setIncludeNumbers(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
              />
              Include Mathematics
            </label>
          </div>
        </div>

        <button
          id="btn-generate-suggestions"
          type="button"
          onClick={fetchSuggestions}
          disabled={isLoading}
          className="w-full mt-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs tracking-wider uppercase rounded-lg shadow-sm font-medium transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {isLoading ? "Generating alternatives..." : "Compute Secure AI Alternatives"}
        </button>
      </div>

      {/* Sandbox Info */}
      {isSandbox && suggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-amber-800 flex gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p>
            <b>Sandbox Mode:</b> Using cryptographic key generators to compute secure alternatives locally. Connect your Google Gemini API key to unlock custom mnemonic explanation matrices!
          </p>
        </div>
      )}

      {/* Current password evaluation */}
      {evaluation && (
        <div className="bg-slate-50 border border-slate-250 rounded-lg p-4 text-xs space-y-2 animate-fadeIn" id="evaluation-card">
          <p className="font-semibold text-slate-800 flex items-center gap-1">
            <Shield className="h-4 w-4 text-indigo-500" />
            Vulnerability Diagnosis of Proposed Input:
          </p>
          <blockquote className="italic text-slate-650 pl-3 border-l-2 border-indigo-400 leading-relaxed">
            "{evaluation}"
          </blockquote>
        </div>
      )}

      {/* Suggested lists */}
      {suggestions.length > 0 ? (
        <div className="space-y-4" id="suggestions-container">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">
            Suggested Cryptographic Formulas
          </span>
          <div className="grid grid-cols-1 gap-4">
            {suggestions.map((s, idx) => (
              <div
                key={idx}
                className="group border border-gray-100 hover:border-indigo-150 rounded-xl p-4 bg-slate-50/50 hover:bg-white transition-all shadow-sm flex flex-col gap-3 relative"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                      {s.type}
                    </span>
                    <p className="text-xs text-slate-400 mt-1 leading-normal font-sans">
                      {s.entropy}
                    </p>
                  </div>
                  <button
                    id={`btn-use-alt-${idx}`}
                    type="button"
                    onClick={() => onSelectPassword(s.password)}
                    className="text-[10px] font-bold text-gray-600 hover:text-indigo-600 bg-white group-hover:bg-indigo-50 border border-gray-150 rounded px-2.5 py-1 transition-all select-none cursor-pointer"
                  >
                    Select in Analyzer
                  </button>
                </div>

                <div className="bg-white group-hover:bg-slate-50 border border-gray-150/70 rounded-lg p-3 relative flex items-center justify-between">
                  <span className="font-mono text-sm tracking-wide text-gray-900 break-all select-all font-semibold pr-4">
                    {s.password}
                  </span>
                  <Key className="h-4 w-4 text-gray-300 absolute right-3 shrink-0" />
                </div>

                {s.rememberTip && (
                  <div className="pt-1.5 border-t border-dashed border-gray-150 text-[11px] text-zinc-600 leading-relaxed flex gap-2">
                    <HelpCircle className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <b className="font-semibold text-gray-700">Mnemonic Helper:</b> {s.rememberTip}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        !isLoading && (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-gray-150 rounded-xl">
            <Key className="h-8 w-8 text-gray-300" />
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">No Alternatives Loaded</span>
            <p className="text-[10px] text-gray-400 max-w-xs leading-relaxed px-4">
              Enter a password in the main Analyzer pane and press the "Compute" button above to evaluate safety and generate recommended structures.
            </p>
          </div>
        )
      )}
    </div>
  );
}
