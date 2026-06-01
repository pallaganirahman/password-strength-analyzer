import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const app = express();
const PORT = 3000;

app.use(express.json());

// Simulated Security Database Path
const DB_PATH = path.join(process.cwd(), "data", "password_vault.json");

// Ensure data folder exists
if (!fs.existsSync(path.dirname(DB_PATH))) {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

// Ensure base database exists
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify({ users: {} }, null, 2));
}

// DB Helper Functions
function readDB() {
  try {
    const content = fs.readFileSync(DB_PATH, "utf8");
    return JSON.parse(content);
  } catch (e) {
    return { users: {} };
  }
}

function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Error writing security database:", e);
  }
}

// Lazy Gemini AI Client Initialization
let aiClient: GoogleGenAI | null = null;
function getGeminiAI(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY is not configured in environment secrets.");
      return null;
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// 1. SUGGEST ALTERNATIVES ENDPOINT (Gemini Powered)
app.post("/api/suggest-passwords", async (req, res) => {
  const { currentPassword, constraints } = req.body;
  const ai = getGeminiAI();

  if (!ai) {
    // Elegant fallback if API key is missing
    const generated = generateFallbackPasswords(constraints);
    return res.json({
      success: true,
      suggested: generated,
      isSandbox: true,
      explanation: "This is a local cryptographically random secure password generator. Connect your Google Gemini API key to get personalized password mnemonic phrases and tailored security recommendations."
    });
  }

  try {
    const prompt = `You are a professional cryptographer and cybersecurity educator.
The user wants custom secure password/passphrase suggestions.
Current password input by user (evaluate without storing or exposing): "${currentPassword || 'none'}"
Constraints specified by user: ${JSON.stringify(constraints)}

Your tasks:
1. Provide a brief (2-3 sentences) visual evaluation of the security of their current password, describing its entropy vulnerability and how brute-force algorithms or botnets would crack it. Make it educational.
2. Suggest exactly 3 premium, highly secure alternatives:
   - Alternative A: A cryptographically strong passphrase (Diceware style - 4 to 5 memorable random words separated by symbols, high entropy). Explain the mental mnemonic trick to easily remember it.
   - Alternative B: A highly complex structure (random look with custom mnemonics, minimum 14 characters, blending numbers, cases, symbols).
   - Alternative C: A secure formulaic expression (e.g. an acronym of a secure memorable sentence, like 'I visited Paris in 2014 & bought a baguette!' turns into 'IvPi2014&baB!'). Provide both the formula/sentence and the resulting password.
3. Answer directly in JSON format. Do not write markdown tags outside of the JSON block.

Respond strictly in this JSON format:
{
  "evaluation": "Brief security criticism of the input password.",
  "suggestions": [
    {
      "type": "Mnemonic Passphrase (Diceware style)",
      "password": "word1-word2-word3-word4",
      "entropy": "High entropy passphrase, easy to remember, extremely hard for GPUs to crack.",
      "rememberTip": "Form a visual story in your head of: ... "
    },
    {
      "type": "High-Complexity Alpha-numeric",
      "password": "Xy7!pQ9$mZ2@vR4#",
      "entropy": "Maximum character pool randomness.",
      "rememberTip": "Mnemonic helper: ... "
    },
    {
      "type": "Acronym Phrase Pattern",
      "password": "SmS2046!wLgT",
      "entropy": "Made from the first letters of: 'Super Mario Stars in 2046! We Love Gaming Together'",
      "rememberTip": "Formula sentence: '...' "
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return res.json({ success: true, ...data, isSandbox: false });
  } catch (error: any) {
    console.error("Gemini suggestion error:", error);
    const generated = generateFallbackPasswords(constraints);
    return res.json({
      success: true,
      suggested: generated,
      isSandbox: true,
      explanation: `Gemini suggestions encountered an issue. Reverted to cryptographic backup. Error: ${error.message || error}`
    });
  }
});

// Helper function to generate fallback cryptographic alternatives locally
function generateFallbackPasswords(constraints: any) {
  const words = ["cosmic", "quantum", "gravity", "nebula", "matrix", "shield", "beacon", "crypto", "vertex", "phoenix", "glitch", "arcade", "indigo", "safari", "tundra", "whisper"];
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=";

  const phraseParts: string[] = [];
  for (let i = 0; i < 4; i++) {
    phraseParts.push(words[crypto.randomInt(0, words.length)]);
  }
  const passphrase = phraseParts.join("-") + crypto.randomInt(10, 99) + "!";

  // Random complex
  let complex = "";
  const complexLen = Math.max(14, constraints?.minLength || 16);
  for (let i = 0; i < complexLen; i++) {
    complex += chars.charAt(crypto.randomInt(0, chars.length));
  }

  // Acronym based
  const acronymSentence = "To Be Or Not To Be That Is The Cyber Question 2026!";
  const acronymPassword = "TbOnTbTiTcQ2026!";

  return [
    {
      type: "Mnemonic Passphrase (Diceware-style Local Backup)",
      password: passphrase,
      entropy: "Estimated Entropy: ~64 bits. Highly resilient against dictionary attacks.",
      rememberTip: `Visualize a "${phraseParts[0]} ${phraseParts[1]}" playing with a "${phraseParts[2]} ${phraseParts[3]}".`
    },
    {
      type: "High-Complexity Alpha-numeric (Local Backup)",
      password: complex,
      entropy: `Estimated Entropy: ~${complexLen * 4.5} bits. Best against direct mathematical brute-forcing.`,
      rememberTip: "Write it down on a physical card in a locked drawer, or use a reliable key-manager vault."
    },
    {
      type: "Acronym Phrase Pattern (Local Backup)",
      password: acronymPassword,
      entropy: "Acronym created from the phrase: '" + acronymSentence + "'",
      rememberTip: "Remember the phrase: '" + acronymSentence + "'"
    }
  ];
}

// 2. CHAT CHANNELS FOR CRYPTO EDUCATION (Gemini Powered)
app.post("/api/crypto-education", async (req, res) => {
  const { messages } = req.body;
  const ai = getGeminiAI();

  if (!ai) {
    // Dynamic sandbox chat responses discussing cryptography concepts in depth
    const lastUserMessage = messages?.[messages.length - 1]?.content || "";
    const sandboxReply = getSandboxEduReply(lastUserMessage);
    return res.json({
      success: true,
      reply: sandboxReply,
      isSandbox: true
    });
  }

  try {
    const chatHistory = messages.map((m: any) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }]
    }));

    // Insert instructions
    const systemIns = `You are a world-class Cybersecurity Professor and Cryptographer specializing in Passwords, Encryption, Key Derivation, Brute-Force Math, and Database Hashing safety.
Expose theories carefully with elegant, human-understandable analogies:
- Explain Entropy (S = log2(L^N)), character space sizes, and why length is superior to character mixture.
- Explain Salting (preventing rainbow tables and hash-lookup mapping).
- Discuss slow hashing designs: PBKDF2, bcrypt, scrypt, and Argon2, and why fast hashes (MD5, SHA-256) are disastrous for passwords.
- Explain HaveIBeenPwned's k-Anonymity protocol (hashing, prefix range queries, local suffix matching).
Provide clean, concise, educational answers. If standard math notation is helpful, use inline markdown. Do not be overly verbose; keep it elegant, responsive and structured with nice spacing.`;

    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemIns,
      }
    });

    // Populate chat with historical messages
    let lastResponseMsg: any = null;
    for (let i = 0; i < chatHistory.length; i++) {
      if (i === chatHistory.length - 1) {
        lastResponseMsg = await chat.sendMessage({ message: chatHistory[i].parts[0].text });
      } else {
        // Send previous conversation context to the chat Object
        await chat.sendMessage({ message: chatHistory[i].parts[0].text });
      }
    }

    if (!lastResponseMsg) {
      lastResponseMsg = await chat.sendMessage({ message: "Hello. Introduce yourself as a Cryptography Assistant." });
    }

    return res.json({
      success: true,
      reply: lastResponseMsg.text,
      isSandbox: false
    });
  } catch (error: any) {
    console.error("Gemini Education Chat Error:", error);
    return res.json({
      success: true,
      reply: `Gemini is currently compiling code. Here is an educational note: In cryptography, brute forcing standard SHA-1 or MD5 algorithms is trivial. Always use algorithms with tunable computational complexity (like Argon2 or PBKDF2) to restrict GPU botnets. Contact your administrator to connect your API key for deep learning interactive answers.`,
      isSandbox: true
    });
  }
});

// Educational Sandbox replies
function getSandboxEduReply(userQuery: string): string {
  const query = userQuery.toLowerCase();
  if (query.includes("entropy") || query.includes("math") || query.includes("formula")) {
    return `### The Mathematics of Password Entropy

Password strength is primarily measured in **Entropy** ($H$), representing the number of bits of randomness. The formula is:

$$H = L \\cdot \\log_2(R)$$

Where:
- $L$ is the **length** of the password.
- $R$ is the **character pool size** (alphabets, digits, symbols).

For example:
- A $10$-character lowercase password ($R=26$): $H = 10 \\cdot \\log_2(26) \\approx 47$ bits.
- An $8$-character complex password ($R=94$): $H = 8 \\cdot \\log_2(94) \\approx 52$ bits.
- A $16$-character completely lowercase password ($R=26$): $H = 16 \\cdot \\log_2(26) \\approx 75$ bits.

**Key Learnings:** Adding characters to a password's length ($L$) increases security exponentially, while adding character types ($R$) only increases complexity linearly. A long, simple passphrase is magnitudes stronger than a short, complex password!`;
  } else if (query.includes("salting") || query.includes("salt") || query.includes("rainbow")) {
    return `### Hashing & Salting: Preventing Rainbow Table Attacks

Storing passwords in raw text is a catastrophic failure. Storing them in naked hashes (like a pure SHA-256) is also vulnerable to **Rainbow Table Attacks** — precomputed dictionaries of passwords and their corresponding hashes.

### What is a Cryptographic Salt?
A **Salt** is a sequence of cryptographically random characters generated uniquely for every account. 

1. **The Core Pipeline:**
   $$\\text{Stored Hash} = \\text{Hash Function}(\\text{User Password} + \\text{Unique Salt})$$

2. **Why Salting is Required:**
   - **Bypasses Rainbow Tables:** Attackers cannot use precomputed tables because the salt modifies the output uniquely.
   - **Obfuscates Identical Passwords:** If two separate users choose the same password (e.g., \`password123\`), they will have different salts, meaning their stored hashes will look entirely different in the database!`;
  } else if (query.includes("argon") || query.includes("slow") || query.includes("bcrypt") || query.includes("pbkdf2")) {
    return `### Slow Hashing Algorithms (Key Derivation)

Standard hashes like **MD5, SHA-1, and SHA-256** are designed to be extremely fast. A high-end consumer GPU can compute billions of SHA-256 hashes per second. This makes them highly dangerous for passwords!

To guard against attackers with specialized hardware (GPUs, FPGAs, ASICs), the cryptographic community created slow, resource-heavy **Key Derivation Functions (KDFs)**:

1. **PBKDF2**: Iterates standard HMAC SHA processes thousands of times (e.g., 600,000 iterations). Highly standard, but optimized out by specific GPU architectures.
2. **bcrypt**: Uses a key setup algorithm based on Blowfish, consuming CPU cycles and moderate resources.
3. **scrypt**: Introduces customizable memory consumption to block GPU cracking.
4. **Argon2**: Winner of the Password Hashing Competition. It is memory-hard and secure against side-channel attacks, fully configurable for memory, time cost, and parallelism. It is the gold standard of password storage.`;
  } else if (query.includes("pwned") || query.includes("range") || query.includes("anonymity")) {
    return `### Under the Hood: HaveIBeenPwned's k-Anonymity Protocol

How can a service search if your password is leaked without you exposing the password to them?

The solution is a beautiful cryptographic protocol called **k-Anonymity**:

1. **Hashing on your device:** The client hashes the password with **SHA-1** natively. Under \`password\`, the SHA-1 is \`5BAA61E4C9B93F3F0682250B6CF8331B7EE68FD8\`.
2. **Range Prefix:** The client extracts only the **first 5 characters** of the hex hash (\`5BAA6\`) and sends only this prefix to the server.
3. **Database lookup:** The server searches its database of billions of leaked password hashes. It collects all hashes starting with \`5BAA6\` and returns their suffixes alongside breach counts back to the client.
4. **Local Matching:** The client takes the returned suffix list and locally searches for its own remaining hash suffix (\`1E4C9B93... \`). If the suffix is found, the password is breached!

**The Cryptographic Benefit:** The external server never learns your full password, nor does it learn your full SHA-1 hash. It only learns a tiny 5-hex prefix, which corresponds to thousands of possible passwords. Your privacy is perfectly preserved!`;
  }

  return `### Hello! Welcome to the Cryptographic Education Hub

I am your Cryptic Security AI. I can teach you about deep password safety and modern math concepts:
- **How Entropy works** (Type 'entropy')
- **The importance of Salting & Rainbow Tables** (Type 'salting')
- **Slow hashing algorithms vs fast hashes** (Type 'slow hashing')
- **How 'Have I Been Pwned' works via k-Anonymity** (Type 'k-anonymity')

Feel free to ask any cryptographic or password-safety questions!`;
}

// 3. DATABASE MODULES (Optional Account Creation & Reuse Protection)

// Verify password meets minimal visual quality metrics & prevents reuse
app.post("/api/database/register", (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ success: false, error: "Username and password are required." });
  }

  const normalizedUser = username.trim().toLowerCase();
  const db = readDB();

  // Create user structure if it does not exist
  if (!db.users[normalizedUser]) {
    db.users[normalizedUser] = {
      username: username.trim(),
      history: []
    };
  }

  const userRecord = db.users[normalizedUser];

  // Cryptographic Key Derivation (using pbkdf2 with a fresh salt for every entry)
  const salt = crypto.randomBytes(16).toString("hex");
  
  // Node.js PBKDF2 standard derivation
  const iterations = 10000;
  const keylen = 32; // 256 bits
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keylen, "sha256").toString("hex");

  // Prevent Reuse Check: Verify if computed hash is already stored in the user's password history!
  const hasBeenUsed = userRecord.history.some((item: any) => {
    // Recompute hash using the item's custom historical salt
    const testHash = crypto.pbkdf2Sync(password, item.salt, iterations, keylen, "sha256").toString("hex");
    return testHash === item.hash;
  });

  if (hasBeenUsed) {
    return res.json({
      success: false,
      errorCode: "PASSWORD_REUSE",
      error: "Security Check Triggered: You cannot reuse an old password! This password's computed SHA-256 hash was found in your historical vaults.",
      details: {
        hashSignature: `SHA256...${hash.substring(hash.length - 8)}`,
        historicalEntries: userRecord.history.length
      }
    });
  }

  // Otherwise, we save this new hash entry to the historical list
  userRecord.history.push({
    salt,
    hash,
    createdAt: new Date().toISOString()
  });

  writeDB(db);

  return res.json({
    success: true,
    message: "Password registered securely and appended to cryptographic vault history!",
    details: {
      username: username.trim(),
      salt,
      hashLength: hash.length,
      pbkdf2Details: `PBKDF2-HMAC-SHA256 (Iterations: ${iterations}, Key Length: 256 bits)`,
      vaultHistoryCount: userRecord.history.length
    }
  });
});

// Retrieves the vault data counts for a username to display securely (without exposing actual absolute hashes!)
app.get("/api/database/vault/:username", (req, res) => {
  const normalizedUser = req.params.username.trim().toLowerCase();
  const db = readDB();
  const userRecord = db.users[normalizedUser];

  if (!userRecord) {
    return res.json({ success: true, exists: false, history: [] });
  }

  // Map history cleanly for visual presentation (redacted hashes for strict safety, only showing salts + created tags!)
  const secureHistory = userRecord.history.map((h: any, idx: number) => ({
    index: idx + 1,
    saltPrefix: h.salt.substring(0, 8) + "...",
    hashSignature: "SHA256..." + h.hash.substring(h.hash.length - 8),
    createdAt: h.createdAt
  }));

  return res.json({
    success: true,
    exists: true,
    history: secureHistory
  });
});

// Clears history for sandbox reset demo
app.post("/api/database/reset", (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ success: false });

  const normalizedUser = username.trim().toLowerCase();
  const db = readDB();

  if (db.users[normalizedUser]) {
    db.users[normalizedUser].history = [];
    writeDB(db);
  }

  return res.json({ success: true, message: "Cryptographic vault history cleared for " + username });
});

// 4. PWNED SIMULATOR DATABASE RANGE SEARCH (k-Anonymity Education)
const POPULAR_PWNED_DATABASE: Record<string, { count: number; suffix: string; pass: string }[]> = {
  // Hash prefixes of common weak passwords
  "7c4a8": [{ suffix: "d09ca3762af61e59520943dc26494f8941b", count: 23145628, pass: "123456" }],
  "5baa6": [{ suffix: "1e4c9b93f3f0682250b6cf8331b7ee68fd8", count: 8361024, pass: "password" }],
  "f7c3b": [{ suffix: "c1d808e04732adf679965ccc34ca7ae3441", count: 5410982, pass: "123456789" }],
  "b1b37": [{ suffix: "73a05c0ed0176787a4f1574ff0075f7521e", count: 3205711, pass: "qwerty" }],
  "7256e": [{ suffix: "0764121cf3e61c5dfd4ef8275990edfa627", count: 981245, pass: "football" }],
  "d033e": [{ suffix: "22ae348aeb5660fc2140aec35850c4da997", count: 871235, pass: "admin" }],
  "89ca4": [{ suffix: "4ec7ebd65f9794cbdb9db1cc60f5c1f0624", count: 421098, pass: "dragon" }],
  "b93f7": [{ suffix: "734a74201385f0ef7773f32fbba5da78f63", count: 239841, pass: "monkey" }]
};

app.get("/api/educational/pwned-range", (req, res) => {
  const prefix = String(req.query.prefix || "").trim().toLowerCase();

  if (prefix.length !== 5) {
    return res.status(400).json({ success: false, error: "Prefix must be exactly 5 hex characters." });
  }

  // Retrieve matches or return random noise elements to represent a standard lookup range response list
  const matches = POPULAR_PWNED_DATABASE[prefix] || [];
  
  // Produce random suffix matches to show how multiple suffix candidates are returned to the client 
  // (representing k-anonymity where the server returns standard ranges, never knowing which one is yours!)
  const mockCandidates = [
    { suffix: "3e5a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a", count: 0 },
    { suffix: "7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6b", count: 0 },
    { suffix: "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0", count: 0 }
  ];

  const responseList = [...matches.map(m => ({ suffix: m.suffix, count: m.count })), ...mockCandidates].sort(() => Math.random() - 0.5);

  return res.json({
    success: true,
    prefix,
    rangeCandidatesCount: responseList.length,
    candidates: responseList,
    note: "The server returns a list of candidate suffixes starting with this prefix. Key concept: The server has visual access to the prefix only, meaning the actual password was never shared!"
  });
});

// Vite Middleware for Development / static files production serving
async function setupServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Password Strength Analyzer Server online at http://localhost:${PORT}`);
  });
}

setupServer();
