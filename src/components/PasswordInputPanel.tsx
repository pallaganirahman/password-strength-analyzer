import React, { useState, useTransition } from "react";
import { Eye, EyeOff, Copy, Check, ShieldAlert, ShieldCheck, Cpu, Network, Server, Info } from "lucide-react";
import { PasswordMetrics } from "../types";

// Common passwords list for instant warning lookup
const COMMON_PASSWORDS = [
  "123456", "password", "123456789", "qwerty", "football", "admin", "dragon", "monkey", "12345678", "12345"
];

export function calculatePasswordMetrics(password: string): PasswordMetrics {
  const L = password.length;
  if (L === 0) {
    return {
      score: 0,
      entropy: 0,
      length: 0,
      hasLower: false,
      hasUpper: false,
      hasNumber: false,
      hasSpecial: false,
      isCommon: false,
      repeatedRatio: 0,
      crackTimeText: "Instant",
      strengthLabel: "Critically Weak",
      colorClass: "bg-red-500",
    };
  }

  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  // Special characters
  const hasSpecial = /[^A-Z0-9]/i.test(password);

  let R = 0;
  if (hasLower) R += 26;
  if (hasUpper) R += 26;
  if (hasNumber) R += 10;
  if (hasSpecial) R += 33; // standard keyboard symbols

  // Entropy calculation: L * log2(R)
  const entropy = Math.round(L * Math.log2(R));

  // Determine repeated character ratios
  const uniqueChars = new Set(password).size;
  const repeatedRatio = 1 - uniqueChars / L;

  // Dictionary check
  const isCommon = COMMON_PASSWORDS.includes(password.toLowerCase());
  const commonIndex = COMMON_PASSWORDS.indexOf(password.toLowerCase());

  // Scoring (0 - 4 based on entropy & dictionary status)
  let score = 0;
  if (isCommon) {
    score = 0;
  } else if (entropy < 32 || L < 6) {
    score = 0;
  } else if (entropy < 48 || L < 8) {
    score = 1;
  } else if (entropy < 64 || L < 10) {
    score = 2;
  } else if (entropy < 80 || L < 12) {
    score = 3;
  } else {
    score = 4;
  }

  // Define scale
  let strengthLabel: "Critically Weak" | "Weak" | "Moderate" | "Strong" | "Cryptographically Strong" = "Weak";
  let colorClass = "bg-red-500";

  if (isCommon) {
    strengthLabel = "Critically Weak";
    colorClass = "bg-rose-600";
  } else if (score === 0) {
    strengthLabel = "Critically Weak";
    colorClass = "bg-rose-500";
  } else if (score === 1) {
    strengthLabel = "Weak";
    colorClass = "bg-orange-500";
  } else if (score === 2) {
    strengthLabel = "Moderate";
    colorClass = "bg-yellow-500";
  } else if (score === 3) {
    strengthLabel = "Strong";
    colorClass = "bg-emerald-500";
  } else {
    strengthLabel = "Cryptographically Strong";
    colorClass = "bg-cyan-500 animate-pulse";
  }

  // Crack Time Texts
  let crackTimeText = "Instant";
  return {
    score,
    entropy,
    length: L,
    hasLower,
    hasUpper,
    hasNumber,
    hasSpecial,
    isCommon,
    commonIndex: commonIndex !== -1 ? commonIndex : undefined,
    repeatedRatio,
    crackTimeText,
    strengthLabel,
    colorClass,
  };
}

// Convert entropy to approximate crack times at different compute intensities
export function getCrackTimeExplanation(entropy: number, speed: "standard" | "gpu" | "supercomputer"): { text: string; raw: number } {
  if (entropy === 0) return { text: "Instant", raw: 0 };
  
  // Guesses per second
  const rates = {
    standard: 1e8,       // 100 Million guesses/sec (Standard PC CPU hash crack)
    gpu: 1e11,            // 100 Billion guesses/sec (Highly optimized offline GPU botnet)
    supercomputer: 1e14,  // 100 Trillion guesses/sec (State actor custom hardware)
  };

  const rate = rates[speed];
  const keyspace = Math.pow(2, entropy);
  // Average attempts required is half the keyspace (50% probability success)
  const seconds = (keyspace / 2) / rate;

  if (seconds < 1) {
    return { text: "Instant (< 1 millisecond)", raw: seconds };
  }
  
  const minutes = seconds / 60;
  if (minutes < 60) {
    return { text: `${Math.round(minutes * 10) / 10} Minutes`, raw: seconds };
  }

  const hours = minutes / 60;
  if (hours < 24) {
    return { text: `${Math.round(hours * 10) / 10} Hours`, raw: seconds };
  }

  const days = hours / 24;
  if (days < 365) {
    return { text: `${Math.round(days)} Days`, raw: seconds };
  }

  const years = days / 365;
  if (years < 1000) {
    return { text: `${Math.round(years).toLocaleString()} Years`, raw: seconds };
  }

  const centuries = years / 100;
  if (centuries < 1000000) {
    return { text: `${Math.round(centuries).toLocaleString()} Centuries`, raw: seconds };
  }

  return { text: `${(years / 1e9).toFixed(1)} Billion Years`, raw: seconds };
}

interface PasswordInputPanelProps {
  password: string;
  onChange: (val: string) => void;
}

export default function PasswordInputPanel({ password, onChange }: PasswordInputPanelProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  const [, startTransition] = useTransition();

  const metrics = calculatePasswordMetrics(password);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Compute crack times for displaying beautiful lists
  const standardCrack = getCrackTimeExplanation(metrics.entropy, "standard");
  const gpuCrack = getCrackTimeExplanation(metrics.entropy, "gpu");
  const supercomputerCrack = getCrackTimeExplanation(metrics.entropy, "supercomputer");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6" id="password-input-wrapper">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-gray-700" />
          Real-time Password Analyzer
        </h2>
        <p className="text-xs text-gray-500 mt-1">
          Type or generate a password to analyze its cryptographic entropy, mathematical complexity, and crack resilience.
        </p>
      </div>

      {/* Input Group */}
      <div className="flex flex-col gap-2">
        <label htmlFor="master-password-input" className="text-xs font-semibold text-gray-650 uppercase tracking-wider">
          Proposed Password
        </label>
        <div className="relative flex items-center">
          <input
            id="master-password-input"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => startTransition(() => onChange(e.target.value))}
            placeholder="Type your password here..."
            className="w-full pr-24 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-gray-700 focus:bg-white transition-all"
            autoComplete="new-password"
          />
          <div className="absolute right-2 flex items-center gap-1">
            <button
              id="btn-toggle-visibility"
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="p-1 px-2 text-xs font-medium text-gray-500 hover:text-gray-900 rounded transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              id="btn-copy-password"
              type="button"
              onClick={handleCopy}
              disabled={!password}
              aria-label="Copy password to clipboard"
              className="p-1.5 text-gray-500 hover:text-gray-950 hover:bg-gray-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-lg transition-all"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600 animate-scale" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {password && (
        <div className="space-y-4 animate-fadeIn">
          {/* Gauge meter and descriptive score */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-gray-450 uppercase tracking-widest">Strength Class</span>
              <span className={`text-sm font-semibold text-gray-900`}>
                {metrics.strengthLabel}
              </span>
            </div>
            
            {/* Visual multi-segment bar representing security score */}
            <div className="grid grid-cols-4 gap-1.5 h-1.5 mt-1" id="strength-meter-grid">
              {[1, 2, 3, 4].map((step) => {
                const isActive = metrics.score >= step;
                return (
                  <div
                    key={step}
                    className={`h-full rounded-sm transition-all duration-300 ${
                      isActive ? metrics.colorClass : "bg-gray-150"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cryptography Math Metric Blocks */}
            <div className="bg-gray-50 rounded-lg border border-gray-150 p-4 flex flex-col justify-between min-h-[100px]">
              <div>
                <span className="text-xs font-bold text-gray-450 uppercase tracking-wide flex items-center gap-1">
                  Information Entropy
                </span>
                <span className="text-2xl font-black font-mono text-gray-950 mt-1 block">
                  {metrics.entropy} <span className="text-xs font-normal text-gray-500">bits</span>
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-normal mt-2">
                Calculates the exponential keyspace density ($2^{metrics.entropy}$). High entropy measures immunity to automated exhaust system hacks.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg border border-gray-150 p-4 flex flex-col justify-between min-h-[100px]">
              <div>
                <span className="text-xs font-bold text-gray-450 uppercase tracking-wide">
                  Complexity Score
                </span>
                <span className="text-2xl font-black text-gray-950 mt-1 block">
                  {metrics.score * 25}%
                </span>
              </div>
              <p className="text-[10px] text-gray-500 leading-normal mt-2 flex items-center gap-1">
                Length: <strong className="font-mono">{metrics.length}</strong> | 
                Pool size: <strong className="font-mono">
                  { (metrics.hasLower ? 26 : 0) + (metrics.hasUpper ? 26 : 0) + (metrics.hasNumber ? 10 : 0) + (metrics.hasSpecial ? 33 : 0) }
                </strong> distinct characters.
              </p>
            </div>
          </div>

          {/* Dictionary Check and alerts */}
          {metrics.isCommon && (
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 flex gap-3 text-xs text-rose-800" id="common-password-alert">
              <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <b className="font-bold">Dangerous Password:</b> Custom dictionary databases flag this password as one of the <b>Top {COMMON_PASSWORDS.length} most common passwords</b>. Rainbow tables or generic scripts can crack this hash instantaneously (0.00ms) by looking it up in tables, regardless of entropy values.
              </div>
            </div>
          )}

          {metrics.repeatedRatio > 0.4 && !metrics.isCommon && (
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex gap-3 text-xs text-amber-800" id="repetition-warning">
              <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <b className="font-bold">High Sequence Repetition:</b> Over {Math.round(metrics.repeatedRatio * 100)}% of your password consists of duplicates or repeated sequences. This drastically collapses the real mathematical search space for intelligent attackers.
              </div>
            </div>
          )}

          {/* Brute Force Comparison Speeds */}
          <div className="border border-gray-100 rounded-lg p-4 bg-white space-y-3" id="brute-force-details">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">
              Time Required to Crack (Brute Force Matrix)
            </span>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-slate-500" />
                  <div>
                    <span className="font-semibold block text-gray-900">Standard Computer CPU</span>
                    <span className="text-[10px] text-gray-400">100M custom checks/sec ($10^8$)</span>
                  </div>
                </div>
                <strong className="font-mono text-gray-800">{standardCrack.text}</strong>
              </div>

              <div className="flex items-center justify-between text-xs pb-2 border-b border-gray-50">
                <div className="flex items-center gap-2">
                  <Network className="h-4 w-4 text-orange-500" />
                  <div>
                    <span className="font-semibold block text-gray-900">GPU Botnet Cluster</span>
                    <span className="text-[10px] text-gray-400">100B checks/sec ($10^{11}$) (e.g. offline brute)</span>
                  </div>
                </div>
                <strong className={`font-mono ${gpuCrack.raw < 3600 ? 'text-rose-600' : 'text-gray-800'}`}>
                  {gpuCrack.text}
                </strong>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Server className="h-4 w-4 text-cyan-600 animate-pulse" />
                  <div>
                    <span className="font-semibold block text-gray-900">Supercomputer Matrix</span>
                    <span className="text-[10px] text-gray-400">100T checks/sec ($10^{14}$) (Government scale)</span>
                  </div>
                </div>
                <strong className="font-mono text-cyan-700">{supercomputerCrack.text}</strong>
              </div>
            </div>
          </div>

          {/* Characters Breakdown Checklist */}
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-2 text-xs">
            <span className="font-semibold text-gray-700 block">Complexity Checks:</span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-650">
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${metrics.length >= 12 ? "bg-emerald-500" : "bg-gray-300"}`} />
                Length is 12+ ({metrics.length}/12)
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${metrics.hasUpper ? "bg-emerald-500" : "bg-gray-300"}`} />
                Has Uppercase Characters
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${metrics.hasLower ? "bg-emerald-500" : "bg-gray-300"}`} />
                Has Lowercase Characters
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${metrics.hasNumber ? "bg-emerald-500" : "bg-gray-300"}`} />
                Has Mathematical Numbers
              </div>
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${metrics.hasSpecial ? "bg-emerald-500" : "bg-gray-300"}`} />
                Has Special Symbols
              </div>
              <div className="flex items-center gap-1.5 col-span-2 text-[10px] text-slate-500 mt-1">
                <Info className="h-3.5 w-3.5 inline mr-0.5 text-gray-420 shrink-0" />
                <span>Tip: A passphrase like <b className="font-mono select-all">"correct-horse-battery-staple"</b> is much longer and more secure than <b className="font-mono select-all">"Tr0ub4dor&amp;3"</b>!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!password && (
        <div className="py-8 flex flex-col items-center justify-center text-center gap-2 border border-dashed border-gray-200 rounded-xl" id="empty-password-visual">
          <ShieldAlert className="h-8 w-8 text-gray-300 animate-pulse" />
          <span className="text-xs font-semibold text-gray-500">Awaiting safe password entry...</span>
          <p className="text-[10px] text-gray-400 max-w-xs leading-normal px-4">
            Input a password above, or consult our AI Generative Suggestions engine in the other tab to discover robust security formulas.
          </p>
        </div>
      )}
    </div>
  );
}
