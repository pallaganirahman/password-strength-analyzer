/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PasswordMetrics {
  score: number; // 0 (weakest) to 4 (strongest)
  entropy: number; // entropy in bits
  length: number;
  hasLower: boolean;
  hasUpper: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  isCommon: boolean; // Top list match
  commonIndex?: number;
  repeatedRatio: number; // Proportion of duplicate/repeated sequences
  crackTimeText: string;
  strengthLabel: "Critically Weak" | "Weak" | "Moderate" | "Strong" | "Cryptographically Strong";
  colorClass: string;
}

export interface SuggestedAlternative {
  type: string;
  password: string;
  entropy: string;
  rememberTip: string;
}

export interface VaultHistoryEntry {
  index: number;
  saltPrefix: string;
  hashSignature: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface KAnonymityStep {
  title: string;
  description: string;
  data: string;
  status: "idle" | "active" | "completed";
}
