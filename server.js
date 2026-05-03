import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { promises as fs } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

// ── OR Settings storage (simple file-based, one JSON per OR room) ──
const OR_SETTINGS_DIR = join(__dirname, "data", "or-settings");
await fs.mkdir(OR_SETTINGS_DIR, { recursive: true }).catch(() => {});

function sanitizeRoomId(s) { return String(s || "").replace(/[^A-Za-z0-9_-]/g, ""); }

app.get("/api/or-settings/:or", async (req, res) => {
  const or = sanitizeRoomId(req.params.or);
  if (!or) return res.status(400).json({ error: "Invalid OR" });
  const file = join(OR_SETTINGS_DIR, `${or}.json`);
  try {
    const raw = await fs.readFile(file, "utf8");
    res.json(JSON.parse(raw));
  } catch (e) {
    if (e.code === "ENOENT") return res.json({ layout: null, presetOverrides: {}, customConfigs: [] });
    console.error("OR settings read error:", e.message);
    res.status(500).json({ error: "Read error" });
  }
});

app.put("/api/or-settings/:or", async (req, res) => {
  const or = sanitizeRoomId(req.params.or);
  if (!or) return res.status(400).json({ error: "Invalid OR" });
  const file = join(OR_SETTINGS_DIR, `${or}.json`);
  try {
    const data = {
      layout: req.body?.layout || null,
      presetOverrides: req.body?.presetOverrides || {},
      customConfigs: req.body?.customConfigs || [],
      updatedAt: new Date().toISOString(),
      updatedBy: req.body?.updatedBy || null,
    };
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
    res.json({ success: true });
  } catch (e) {
    console.error("OR settings write error:", e.message);
    res.status(500).json({ error: "Write error" });
  }
});
app.use(express.static(join(__dirname, "dist")));

// Serve videos with range support for streaming
app.use("/videos", express.static(join(__dirname, "public", "videos"), {
  setHeaders: (res) => { res.set("Accept-Ranges", "bytes"); }
}));

// Serve assets (logos, backgrounds)
app.use("/assets", express.static(join(__dirname, "public", "assets")));

// Login endpoint
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Missing credentials" });
  if (!email.toLowerCase().endsWith("@trackimed.com")) return res.status(401).json({ error: "Access restricted to @trackimed.com" });
  if (password !== "orking@Tracki") return res.status(401).json({ error: "Invalid password" });
  const name = email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
  res.json({ success: true, user: { email, name } });
});

// Claude API proxy for enhancing feedback
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post("/api/enhance", async (req, res) => {
  const { text, screen, category, priority } = req.body;
  if (!text) return res.status(400).json({ error: "Missing text" });

  try {
    const msg = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [{
        role: "user",
        content: `You are helping a team review a mockup of a medical OR (Operating Room) dashboard app called TrackiMed ORKing.

A team member left this brief feedback on the "${screen}" screen (category: ${category}, priority: ${priority}):
"${text}"

Rewrite this as a clear, actionable modification request in 2-3 sentences. Include:
1. What specific UI element or behavior needs to change
2. What the current issue is
3. What the expected result should be

Be concise and professional. Do not use markdown. Write only the enhanced description, nothing else.`
      }]
    });
    res.json({ enhanced: msg.content[0].text });
  } catch (err) {
    console.error("Claude API error:", err.message);
    res.status(500).json({ error: "Failed to enhance feedback" });
  }
});

// SPA fallback
app.get("/{*splat}", (req, res) => {
  res.sendFile(join(__dirname, "dist", "index.html"));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
