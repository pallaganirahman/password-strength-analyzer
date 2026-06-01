import React, { useState } from "react";
import { Server, Cpu, Layers, Lock, Search, AlertCircle, RefreshCw, Send, CheckCircle2 } from "lucide-react";
import { KAnonymityStep } from "../types";

// Standard client-side SHA-1 visual implementation to show exactly how SHA-1 gets generated step by step!
async function getSHA1Hex(message: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex.toUpperCase();
}

export default function KAnonymityVisualizer() {
  const [testPassword, setTestPassword] = useState("password");
  const [isLoading, setIsLoading] = useState(false);
  const [sha1Value, setSha1Value] = useState("");
  const [prefixHex, setPrefixHex] = useState("");
  const [suffixHex, setSuffixHex] = useState("");
  const [apiCandidates, setApiCandidates] = useState<{ suffix: string; count: number }[]>([]);
  const [matchResult, setMatchResult] = useState<{ found: boolean; count: number } | null>(null);
  
  // Custom states to control step highlights
  const [steps, setSteps] = useState<KAnonymityStep[]>([
    {
      title: "Step 1: Local Full Hashing",
      description: "Client hashes the password locally using standard mathematical SHA-1. The plain password is never transmitted, serialized, or sent off this machine.",
      data: "Click Run Protocol to generate...",
      status: "idle"
    },
    {
      title: "Step 2: Prefix/Suffix Extraction",
      description: "Client slices the resulting 40-character hex hash. The exact first 5 letters are selected as the public prefix routing filter, retaining the secret remaining 35-letter suffix locally.",
      data: "Click Run Protocol...",
      status: "idle"
    },
    {
      title: "Step 3: Range Query API dispatch",
      description: "Only the public 5-char prefix is transmitted. The server returns a range candidate matrix containing all breached suffixes starting with this prefix. Server remains completely blind to your suffix!",
      data: "Awaiting fetch...",
      status: "idle"
    },
    {
      title: "Step 4: Local Suffix Filtering Match",
      description: "The client browser loops over the returned server response suffixes locally. If a exact matching suffix is matched, we report a security breach, otherwise you are safe!",
      data: "Awaiting local compare...",
      status: "idle"
    }
  ]);

  const handleRunProtocol = async () => {
    if (!testPassword) return;
    setIsLoading(true);
    setMatchResult(null);

    // Reset status steps
    const cleanSteps = steps.map(s => ({ ...s, status: "idle" as const }));
    setSteps(cleanSteps);

    try {
      // Step 1: Client side SHA-1
      const fullHash = await getSHA1Hex(testPassword);
      setSha1Value(fullHash);

      // Slicing prefix rules
      const prefix = fullHash.substring(0, 5);
      const suffix = fullHash.substring(5);
      setPrefixHex(prefix);
      setSuffixHex(suffix);

      // Mutate steps Visual State
      const step1 = { ...cleanSteps[0], status: "completed" as const, data: `Hash: ${fullHash}` };
      const step2 = { ...cleanSteps[1], status: "completed" as const, data: `Prefix (First 5): "${prefix}" | Suffix (Rest): "${suffix.substring(0, 8)}..."` };
      setSteps([step1, step2, { ...cleanSteps[2], status: "active" as const }, cleanSteps[3]]);

      // Step 3: Server Range query fetch 
      const response = await fetch(`/api/educational/pwned-range?prefix=${prefix.toLowerCase()}`);
      const data = await response.json();
      
      const serverCandidates = data.candidates || [];
      setApiCandidates(serverCandidates);

      const step3 = { ...step2, status: "completed" as const, data: `Fetched ${serverCandidates.length} candidate suffixes from prefix: "${prefix}". Server knows nothing about "${suffix.substring(0, 8)}...".` };
      setSteps([step1, step3, { ...cleanSteps[2], status: "completed" as const, data: `GET /api/educational/pwned-range?prefix=${prefix}` }, { ...cleanSteps[3], status: "active" as const }]);

      // Step 4: Local matching process
      const formattedSuffix = suffix.toLowerCase();
      const matched = serverCandidates.find((c: any) => c.suffix.toLowerCase() === formattedSuffix);

      if (matched) {
        setMatchResult({ found: true, count: matched.count });
      } else {
        setMatchResult({ found: false, count: 0 });
      }

      setSteps([
        step1,
        step3,
        { ...cleanSteps[2], status: "completed" as const, data: `GET /api/educational/pwned-range?prefix=${prefix}` },
        { 
          ...cleanSteps[3], 
          status: "completed" as const, 
          data: matched 
            ? `Match Found! Local client matched prefix index suffix in response. Leaked: ${matched.count.toLocaleString()} times!` 
            : "No Match. Suffix was not found in the returned range. Password is safe from this database list!"
        }
      ]);

    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6 select-none" id="k-anonymity-visualizer">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
          <Layers className="h-5 w-5 text-indigo-500" />
          k-Anonymity Leak Simulator
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Explore how 'Have I Been Pwned' visualizes password breaches securely without letting the external server see your raw password or complete SHA-1 hash.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Control Panel input */}
        <div className="flex-1 bg-gray-50 border border-gray-100 rounded-xl p-4 flex flex-col gap-4">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">
            Test Leak Query
          </span>

          <div className="space-y-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pwned-test-input" className="text-xs font-semibold text-gray-700">
                Input Leaked or Custom Password
              </label>
              <input
                id="pwned-test-input"
                type="text"
                value={testPassword}
                onChange={(e) => setTestPassword(e.target.value)}
                placeholder="password, 123456, or custom phrase..."
                className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-[10px] text-gray-400">
                Try <b>password</b> or <b>123456</b> (known breaches) vs a strong custom password.
              </span>
            </div>

            <button
              id="btn-run-pwned-protocol"
              type="button"
              disabled={isLoading || !testPassword}
              onClick={handleRunProtocol}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wider uppercase rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Run k-Anonymity Protocol
            </button>
          </div>

          {/* Suffix Match Indicator Visual */}
          {matchResult !== null && (
            <div
              className={`border rounded-lg p-4 text-xs flex gap-3 animate-fadeIn mt-2 ${
                matchResult.found
                  ? "bg-rose-50 border-rose-100 text-rose-800"
                  : "bg-emerald-50 border-emerald-100 text-emerald-800"
              }`}
              id="protocol-result-state"
            >
              <Lock className={`h-5 w-5 shrink-0 mt-0.5 ${matchResult.found ? "text-rose-600 animate-bounce" : "text-emerald-600"}`} />
              <div>
                <b className="font-bold">
                  {matchResult.found ? "Breach Detected locally!" : "No Breaches detected!"}
                </b>
                <p className="mt-1 leading-normal text-slate-650">
                  {matchResult.found
                    ? `This specific SHA-1 hash suffix was matched locally on your device! It has been leaked in database breaches exactly: ${matchResult.count.toLocaleString()} times.`
                    : "The 35-character secret suffix remained unique in the server collection range! This is a highly resilient, unique signature."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Step flow visual list */}
        <div className="flex-1 space-y-3">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">
            Cryptographic Data Pipeline (Real-Time logs)
          </span>

          <div className="space-y-2.5" id="steps-pipeline">
            {steps.map((s, idx) => {
              const isActive = s.status === "active";
              const isCompleted = s.status === "completed";
              return (
                <div
                  key={idx}
                  className={`border rounded-lg p-3 transition-all ${
                    isActive
                      ? "bg-indigo-50/50 border-indigo-200 ring-1 ring-indigo-200"
                      : isCompleted
                      ? "bg-white border-gray-150"
                      : "bg-white border-gray-100 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-black ${
                        isCompleted
                          ? "bg-indigo-100 text-indigo-750"
                          : isActive
                          ? "bg-indigo-600 text-white animate-pulse"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? "✓" : idx + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <b className={`text-xs block font-bold text-gray-900`}>{s.title}</b>
                      <p className="text-[10px] text-gray-500 leading-relaxed mt-0.5">
                        {s.description}
                      </p>
                      {s.status !== "idle" && (
                        <div className="mt-1.5 p-1.5 px-2 bg-slate-900 rounded text-[9px] font-mono text-cyan-400 break-all select-all flex justify-between items-center bg-zinc-950">
                          <span>{s.data}</span>
                          <Cpu className="h-3.5 w-3.5 text-cyan-600" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive candidates server map response */}
      {apiCandidates.length > 0 && (
        <div className="border border-gray-150 rounded-xl p-4 bg-gray-50 flex flex-col gap-3" id="database-range-response">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-200">
            <span className="font-bold text-gray-700 flex items-center gap-1.5">
              <Server className="h-4 w-4 text-cyan-600 animate-pulse" />
              Retrieved Suffix Candidate Pool for prefix (k-Anonymity Output)
            </span>
            <span className="text-[10px] font-mono text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full font-bold">
              GET .../pwned-range?prefix={prefixHex.toLowerCase()}
            </span>
          </div>

          <p className="text-[10px] text-gray-500 leading-normal">
            The server returned the following exact suffix rows in response to prefix <b>{prefixHex}</b>. Your browser compared these locally. Observe how the server cannot infer which row (if any) is your actual suffix!
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {apiCandidates.map((c, idx) => {
              const isLocalMatch = c.suffix.toLowerCase() === suffixHex.toLowerCase();
              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border text-[10px] font-mono flex justify-between items-center transition-all ${
                    isLocalMatch
                      ? "bg-rose-50 border-rose-200 text-rose-900 font-bold ring-1 ring-rose-300"
                      : "bg-white border-gray-150 text-gray-600"
                  }`}
                >
                  <div className="truncate pr-4 flex items-center gap-1.5">
                    {isLocalMatch ? (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    ) : (
                      <Search className="h-3.5 w-3.5 text-gray-300 shrink-0" />
                    )}
                    <span className="truncate">{c.suffix}</span>
                  </div>
                  <span className={`shrink-0 font-sans px-1.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                    c.count > 0 ? "bg-red-50 text-red-650" : "bg-slate-55 text-slate-450"
                  }`}>
                    {c.count > 0 ? `${c.count.toLocaleString()} leaks` : "noise / dummy"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
