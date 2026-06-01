import React, { useState, useEffect } from "react";
import { Server, Database, Key, HelpCircle, Lock, AlertCircle, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import { VaultHistoryEntry } from "../types";

interface VaultManagerPanelProps {
  currentPassword: string;
}

export default function VaultManagerPanel({ currentPassword }: VaultManagerPanelProps) {
  const [username, setUsername] = useState("anonymous_explorer");
  const [history, setHistory] = useState<VaultHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error"; message: string; details?: any } | null>(null);

  const fetchVaultHistory = async (targetUser: string) => {
    if (!targetUser.trim()) return;
    try {
      const res = await fetch(`/api/database/vault/${encodeURIComponent(targetUser)}`);
      const data = await res.json();
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchVaultHistory(username);
  }, [username]);

  const handleRegisterPassword = async () => {
    if (!username.trim() || !currentPassword) return;
    setIsLoading(true);
    setAlert(null);

    try {
      const res = await fetch("/api/database/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password: currentPassword
        })
      });

      const data = await res.json();
      if (data.success) {
        setAlert({
          type: "success",
          message: data.message,
          details: data.details
        });
        fetchVaultHistory(username);
      } else {
        setAlert({
          type: "error",
          message: data.error || "Failed to catalog password.",
          details: data.details
        });
      }
    } catch (e) {
      console.error(e);
      setAlert({
        type: "error",
        message: "Connectivity error targeting server vault."
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetHistory = async () => {
    if (!username.trim()) return;
    try {
      const res = await fetch("/api/database/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (data.success) {
        setAlert({
          type: "success",
          message: data.message || "Cryptographic vault reset successfully."
        });
        setHistory([]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6 select-none" id="vault-manager-panel">
      <div className="flex justify-between items-start pb-2 border-b border-gray-50">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight flex items-center gap-2">
            <Database className="h-5 w-5 text-gray-700" />
            Cryptographic History Vault (DB Mode)
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Learn cryptographic salting and key derivation (PBKDF2) by attempting to reuse old password hashes.
          </p>
        </div>
        <button
          id="btn-clear-db-profile"
          type="button"
          onClick={handleResetHistory}
          disabled={!history.length}
          className="p-1 px-2.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-40 border border-slate-205 rounded text-gray-500 hover:text-gray-900 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 cursor-pointer transition-colors"
          title="Reset user registry"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Reset Profile
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end">
        {/* Username Selection input */}
        <div className="flex-1 w-full flex flex-col gap-1.5 pb-1">
          <label htmlFor="vault-username-input" className="text-xs font-semibold text-gray-700">
            Database Account Nickname
          </label>
          <div className="relative flex items-center">
            <input
              id="vault-username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
              placeholder="Enter unique name..."
              className="w-full pr-10 pl-4 py-2 bg-gray-50/50 border border-gray-200 rounded-lg text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-700 focus:bg-white"
            />
            <Database className="h-4 w-4 text-gray-405 absolute right-3 shrink-0" />
          </div>
        </div>

        {/* Action Button */}
        <button
          id="btn-register-vault-password"
          type="button"
          disabled={isLoading || !currentPassword}
          onClick={handleRegisterPassword}
          className="w-full md:w-auto py-2 px-6 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs tracking-wider uppercase rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 shrink-0"
        >
          Register Active Password
        </button>
      </div>

      {/* Alert block */}
      {alert && (
        <div
          className={`border rounded-lg p-4 text-xs flex gap-3 animate-fadeIn ${
            alert.type === "success"
              ? "bg-emerald-50 border-emerald-100 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
          id="vault-alert-status"
        >
          {alert.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <b className="font-semibold">{alert.message}</b>
            
            {alert.details && (
              <div className="mt-2.5 p-3 bg-zinc-950 rounded text-[10px] text-cyan-400 font-mono space-y-1.5 border border-zinc-800 leading-normal">
                <p className="font-extrabold text-cyan-500 uppercase tracking-widest text-[9px] border-b border-zinc-900 pb-1">
                  Cryptographic Pipeline Telemetry
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-semibold">Username:</span>
                    <span className="text-gray-200 font-bold">{alert.details.username}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase font-semibold">Salt (Secret Prefix):</span>
                    <span className="text-gray-200 font-bold truncate block">{alert.details.salt || "Already matches cached salt!"}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-500 block text-[9px] uppercase font-semibold">KDF System Function:</span>
                    <span className="text-gray-200 font-medium">{alert.details.pbkdf2Details || "Sha256 hash verify"}</span>
                  </div>
                </div>
              </div>
            )}
            
            {alert.type === "error" && (
              <p className="mt-1 pb-1 text-rose-800 italic select-none">
                Reuse block prevents credential-stuffing hacks. Storing multiple passwords in custom salted iterations establishes secure account practices.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Database visual logs list */}
      <div className="space-y-3" id="vault-logs">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block flex items-center justify-between">
          <span>Persisted Account Vault Suffixes ({history.length} Keys)</span>
          <span className="text-[10px] font-sans font-normal text-gray-400">PBKDF2 SHA256 standard salting</span>
        </span>

        {history.length > 0 ? (
          <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
            {history.map((h) => (
              <div
                key={h.index}
                className="border border-gray-150 hover:bg-slate-50/50 rounded-lg p-3 flex flex-col sm:flex-row justify-between sm:items-center text-xs gap-2 select-text font-sans bg-white"
              >
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded bg-gray-100 flex items-center justify-center font-mono font-bold text-[10px] text-gray-550 shrink-0">
                    #{h.index}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-slate-400" />
                      <span className="font-mono text-[10px] text-indigo-600 bg-indigo-50 px-1.5 rounded">{h.hashSignature}</span>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-0.5 block">Stored at: {new Date(h.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                  <span>Salt SaltPrefix:</span>
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-700 font-bold">{h.saltPrefix}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 flex flex-col items-center justify-center text-center gap-1.5 border border-dashed border-gray-150 rounded-xl bg-slate-50/50">
            <ShieldCheck className="h-7 w-7 text-gray-300" />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No hashes persisted for this account</span>
            <p className="text-[9px] text-gray-450 max-w-xs leading-normal px-4">
              Type credentials or select alternatives, and press <b>Register Active Password</b> to populate secure server vaults!
            </p>
          </div>
        )}
      </div>

      {/* Conceptual tutorial info block */}
      <div className="bg-slate-50/60 border border-gray-100 p-4 rounded-xl text-[11px] leading-relaxed text-slate-600 space-y-2 flex items-start gap-2.5">
        <HelpCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
        <div>
          <b className="font-semibold text-gray-800">Visualizing Server Storage Best Practices</b>
          <p className="mt-1">
            Real enterprise password registries never write your plaintext passwords to disk. Instead, when you click register, the server mixes a custom <b>random 16-byte cryptographic Salt</b> into your entry, loops it 10,000 times through key derivation protocols, and stores the resulting hash securely.
          </p>
          <ul className="list-disc pl-4 space-y-1 mt-2 font-medium text-[10.5px]">
            <li><b>Precludes Rainbow Attacks:</b> Even identical passwords choose unique random salt strings yielding completely different hashes.</li>
            <li><b>Reduces Brute Complexity:</b> Storing custom iterated slow PBKDF2 hashes slows attacker dictionary scripts exponentially.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
