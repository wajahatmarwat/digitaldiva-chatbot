import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { config } from "./config.js";
import { retrieveKnowledge, formatKnowledgeContext } from "./services/retriever.js";
import { generateChatReply } from "./services/ai.js";
import { saveLead } from "./services/leads.js";

const app = express();

app.use(helmet({ 
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: false,
  frameguard: false
}));
app.use(
  cors({
    origin: config.allowedOrigin === "*" ? true : config.allowedOrigin
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 80,
    standardHeaders: true,
    legacyHeaders: false
  })
);

const sessions = new Map();

const chatSchema = z.object({
  sessionId: z.string().optional(),
  message: z.string().min(1).max(2000),
  metadata: z
    .object({
      page: z.string().optional(),
      source: z.string().optional()
    })
    .optional()
});

const leadSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  company: z.string().max(150).optional().default(""),
  phone: z.string().max(60).optional().default(""),
  budget: z.string().max(80).optional().default(""),
  goals: z.string().min(3).max(800),
  source: z.string().max(120).optional().default("website-chatbot"),
  sessionId: z.string().optional().default("")
});

app.use(express.static("public"));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    const payload = chatSchema.parse(req.body);
    const sessionId = payload.sessionId || uuidv4();

    const contextItems = retrieveKnowledge(payload.message);
    const contextSnippet = formatKnowledgeContext(contextItems);

    const history = sessions.get(sessionId) || [];

    const reply = await generateChatReply({
      userMessage: payload.message,
      contextItems,
      contextSnippet,
      history
    });

    const updated = [
      ...history,
      { role: "user", content: payload.message },
      { role: "assistant", content: reply }
    ].slice(-16);

    sessions.set(sessionId, updated);

    res.json({
      sessionId,
      reply,
      suggestions: [
        "Tell me your business goal",
        "Show SEO pricing ranges",
        "Book a consultation"
      ]
    });
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: "Invalid chat request",
        details: error.flatten()
      });
    }

    return res.status(500).json({
      error: "Chat request failed"
    });
  }
});

app.post("/api/lead", async (req, res) => {
  try {
    const lead = leadSchema.parse(req.body);
    const saved = await saveLead(lead);

    res.status(201).json({
      ok: true,
      lead: saved
    });
  } catch (error) {
    console.error(error);

    if (error instanceof z.ZodError) {
      // return structured validation errors to the client for clearer feedback
      return res.status(400).json({
        error: "Invalid lead payload",
        message: error.message,
        details: error.errors
      });
    }

    return res.status(500).json({
      error: "Could not save lead"
    });
  }
});

app.post('/api/audit', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    // Basic fetch and lightweight HTML checks
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    const html = await resp.text();

    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i) || html.match(/<meta\s+content=["']([^"']*)["']\s+name=["']description["']/i);
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const viewport = html.match(/<meta\s+name=["']viewport["']\s+content=["']([^"']*)["']/i);

    const report = {
      status: resp.status,
      ok: resp.ok,
      title: titleMatch ? titleMatch[1].trim() : null,
      metaDescription: metaDesc ? metaDesc[1].trim() : null,
      h1: h1Match ? h1Match[1].trim() : null,
      hasViewport: Boolean(viewport),
      length: html.length
    };

    res.json({ report });
  } catch (err) {
    console.error('Audit failed', err?.message || err);
    res.status(500).json({ error: 'Audit failed', details: String(err?.message || err) });
  }
});

app.listen(config.port, () => {
  console.log(`Digital Diva chatbot running on port ${config.port}`);
});

// global error handlers to capture uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : String(err));
  // allow process to exit after logging
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise Rejection:', reason);
});

// periodic memory usage log to help diagnose SIGKILL / OOM (exit code 137)
setInterval(() => {
  try {
    const m = process.memoryUsage();
    console.log('memoryUsage', Object.fromEntries(Object.entries(m).map(([k,v])=>[k, Math.round(v/1024/1024)+'MB'])));
  } catch (e) {
    // ignore
  }
}, 30_000);
